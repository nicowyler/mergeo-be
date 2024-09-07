import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Company } from '../../modules/company/company.entity';
import {
  BranchesResponseDto,
  CreateBranchDto,
  CreateCompanyDto,
  UpdateBranchDto,
  UpdateCompanyDto,
} from '../../modules/company/dto';
import { ErrorMessages } from '../../common/enum/errorMessages.enum';
import { Branch } from '../../modules/company/branch.entity';
import { UUID } from 'crypto';
import { User } from 'src/modules/user/user.entity';
import { convertCoordinatesForPostGIS } from 'src/common/utils/postGis.utils';
import { Address } from 'src/modules/company/address.entity';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
  ) {}

  async createCompany(body: CreateCompanyDto) {
    console.log(body);
    try {
      const coordinatesArray: number[] = body.address.polygon.coordinates;

      const newAddress = new Address();
      newAddress.locationId = body.address.id;
      newAddress.name = body.address.name;
      newAddress.polygon = convertCoordinatesForPostGIS(coordinatesArray);

      const newCompany = new Company();
      newCompany.name = body.name;
      newCompany.razonSocial = body.razonSocial;
      newCompany.cuit = body.cuit;
      newCompany.address = newAddress;
      newCompany.activity = body.activity;

      const result = await this.companyRepository.save(newCompany);
      return result;
    } catch (error) {
      console.log(error);
      if (error.code === '23505') {
        if (error.constraint === 'UQ_COMPANY_NAME') {
          throw new ConflictException(ErrorMessages.COMPANY_NAME_TAKEN);
        }
        if (error.constraint === 'UQ_BUSINESS_NAME') {
          throw new ConflictException(
            ErrorMessages.COMPANY_BUSINESS_NAME_TAKEN,
          );
        }
        if (error.constraint === 'UQ_CUIT') {
          throw new ConflictException(ErrorMessages.COMPANY_CUIT_TAKEN);
        }
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async getCompanyById(companyId: string) {
    try {
      const companyExists = await this.companyRepository.findOneBy({
        id: companyId,
      });
      if (!companyExists) {
        throw new NotFoundException(
          `${ErrorMessages.COMPANY_NOT_FOUND} ${companyId}`,
        );
      }
      const company = await this.companyRepository
        .createQueryBuilder('company')
        .leftJoinAndSelect('company.users', 'users')
        .leftJoinAndSelect('company.branches', 'branches')
        .leftJoinAndSelect('company.address', 'address')
        .select([
          'company',
          'users.id',
          'users.firstName',
          'users.lastName',
          'users.email',
          'users.accountType',
          'branches.id',
          'branches.name',
          'address.id',
          'address.name',
          'address.polygon',
        ])
        .where('company.id = :id', { id: companyId })
        .getOne();

      return company;
    } catch (error) {
      throw error;
    }
  }

  async getCompanyByUserId(user: User): Promise<Company> {
    const company = await this.companyRepository
      .createQueryBuilder('company')
      .leftJoinAndSelect('company.users', 'users')
      .select(['company', 'users.id'])
      .where('company.id = :id', { id: user.company.id })
      .getOne();

    if (!company) {
      throw new NotFoundException(
        `${ErrorMessages.COMPANY_NOT_FOUND} for user ${user.id}`,
      );
    }

    return company;
  }

  async updateCompany(id: UUID, body: UpdateCompanyDto) {
    try {
      // Find the branch and its related address
      const company = await this.companyRepository.findOne({
        where: { id },
        relations: ['address'], // Load the related address
      });

      if (!company) {
        throw new NotFoundException(`${ErrorMessages.COMPANY_NOT_FOUND} ${id}`);
      }

      // Update company properties
      const newCompany = new Company();
      newCompany.name = body.name;
      newCompany.activity = body.activity;

      if (body.address) {
        const { id: locationId, polygon, ...addressData } = body.address;

        // Convert coordinates to PostGIS format
        const postGISPolygon = polygon
          ? convertCoordinatesForPostGIS(polygon.coordinates)
          : undefined;

        // Update the address data
        const updatedAddressData = {
          ...addressData,
          polygon: postGISPolygon,
        };

        // Check if an address with the given locationId exists
        let address = await this.addressRepository.findOne({
          where: { locationId },
        });

        if (address) {
          // Update existing address
          address = { ...address, ...updatedAddressData };
          address = await this.addressRepository.save(address);
        } else {
          // Create a new address if it does not exist
          address = await this.addressRepository.save({
            locationId,
            ...updatedAddressData,
          });
        }

        // Link the address to the company
        newCompany.address = address;
      }

      // Save the updated company
      await this.companyRepository.update(id, newCompany);

      const updatedCompany = await this.companyRepository.findOne({
        where: { id },
        relations: ['address'], // Load the related address
      });

      return updatedCompany;
    } catch (error) {
      if (error.code === '23502') {
        throw new NotFoundException(`${ErrorMessages.BRANCH_NOT_FOUND} ${id}`);
      } else {
        throw error;
      }
    }
  }

  async createBranch(
    companyId: string,
    createBranchDto: CreateBranchDto,
  ): Promise<Omit<Branch, 'company'>> {
    try {
      const company = await this.companyRepository.findOne({
        where: { id: companyId },
        relations: ['branches'], // Include branches in the query
      });

      if (!company) {
        throw new NotFoundException(
          `${ErrorMessages.COMPANY_NOT_FOUND} ${companyId}`,
        );
      }

      const address = new Address();
      address.locationId = createBranchDto.address.id;
      address.name = createBranchDto.address.name;
      address.polygon = convertCoordinatesForPostGIS(
        createBranchDto.address.polygon.coordinates,
      );

      const savedAddress = await this.addressRepository.save(address);
      const branch = new Branch();
      branch.name = createBranchDto.name;
      branch.email = createBranchDto.email;
      branch.phoneNumber = createBranchDto.phoneNumber;
      branch.company = company;
      branch.address = savedAddress;

      const savedBranch = await this.branchRepository.save(branch);

      const branchWithoutCompany = {
        id: savedBranch.id,
        name: savedBranch.name,
        email: savedBranch.email,
        phoneNumber: savedBranch.phoneNumber,
        address: savedBranch.address,
        // Add other properties if necessary
      };

      return branchWithoutCompany;
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException(ErrorMessages.BRANCH_NAME_TAKEN);
      } else {
        throw error;
      }
    }
  }

  async updateBranch(id: UUID, body: UpdateBranchDto) {
    try {
      // Find the branch and its related address
      const branch = await this.branchRepository.findOne({
        where: { id },
        relations: ['address'], // Load the related address
      });

      if (!branch) {
        throw new NotFoundException(`${ErrorMessages.BRANCH_NOT_FOUND} ${id}`);
      }

      // Update branch properties
      branch.name = body.name ?? branch.name;
      branch.email = body.email ?? branch.email;
      branch.phoneNumber = body.phoneNumber ?? branch.phoneNumber;

      if (body.address) {
        const { id: locationId, polygon, ...addressData } = body.address;

        // Convert coordinates to PostGIS format
        const postGISPolygon = polygon
          ? convertCoordinatesForPostGIS(polygon.coordinates)
          : undefined;

        // Update the address data
        const updatedAddressData = {
          ...addressData,
          polygon: postGISPolygon,
        };

        // Check if an address with the given locationId exists
        let address = await this.addressRepository.findOne({
          where: { locationId },
        });

        if (address) {
          // Update existing address
          address = { ...address, ...updatedAddressData };
          address = await this.addressRepository.save(address);
        } else {
          // Create a new address if it does not exist
          address = await this.addressRepository.save({
            locationId,
            ...updatedAddressData,
          });
        }

        // Link the address to the branch
        branch.address = address;
      }

      // Save the updated branch
      const updatedBranch = await this.branchRepository.save(branch);
      return updatedBranch;
    } catch (error) {
      if (error.code === '23502') {
        throw new NotFoundException(`${ErrorMessages.BRANCH_NOT_FOUND} ${id}`);
      } else {
        throw error;
      }
    }
  }

  async getBranches(companyId: string): Promise<BranchesResponseDto> {
    try {
      const company = await this.companyRepository.findOne({
        where: { id: companyId },
        relations: ['branches', 'branches.address'], // Load related branches and addresses
      });

      if (!company) {
        throw new NotFoundException('Company not found');
      }

      const branches = await this.branchRepository.find({
        where: { company: { id: companyId } },
        relations: ['address'], // Ensure address is included
      });

      const result: BranchesResponseDto = {
        company: {
          id: company.id,
          name: company.name,
          branches: branches.map((branch) => ({
            id: branch.id,
            name: branch.name,
            email: branch.email,
            phoneNumber: branch.phoneNumber,
            address: branch.address,
          })),
        },
      };

      return result;
    } catch (error) {
      throw error;
    }
  }

  async deleteBranch(branchId: string) {
    try {
      const branch = await this.branchRepository.find({
        where: { id: branchId },
        relations: ['address'], // Ensure address is included
      });
      if (!branch) {
        throw new NotFoundException('branch not found');
      }

      this.branchRepository.remove(branch);
    } catch (error) {
      throw error;
    }
  }
}
