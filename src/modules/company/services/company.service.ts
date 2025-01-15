import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateCompanyDto, UpdateCompanyDto } from 'src/modules/company/dto';
import { Address } from 'src/modules/company/entities/address.entity';
import { Company } from 'src/modules/company/entities/company.entity';
import { ErrorMessages } from 'src/common/enum/errorMessages.enum';
import { Branch } from '../entities/branch.entity';
import { UUID } from 'crypto';
import { User } from 'src/modules/user/user.entity';
import { convertCoordinatesForPostGIS } from 'src/common/utils/postGis.utils';
import { ClientBlackList } from 'src/modules/company/entities/client-black-list.entity';
import { BranchService } from 'src/modules/company/services/branches.service';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    @InjectRepository(ClientBlackList)
    private readonly branchService: BranchService,
  ) {}

  async createCompany(body: CreateCompanyDto) {
    console.log(body);
    try {
      // Create the new Company entity
      const newCompany = new Company();
      newCompany.name = body.name;
      newCompany.razonSocial = body.razonSocial;
      newCompany.cuit = body.cuit;
      newCompany.activity = body.activity;

      // Save the company first
      const savedCompany = await this.companyRepository.save(newCompany);

      // After the company is saved, create the branch using createBranch method
      const branch = new Branch();
      branch.name = body.branch.name || 'Principal';
      branch.email = body.branch.email ?? '';
      branch.phoneNumber = body.branch.phoneNumber ?? '';
      branch.isMain = true;
      branch.address = body.branch.address;

      // Create the branch associated with the company
      const createdBranch = await this.branchService.createBranch(
        savedCompany.id,
        branch,
      );

      return {
        company: savedCompany,
        branch: createdBranch,
      };
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

  async getCompanyById(companyId: UUID) {
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
        .leftJoinAndSelect('company.users', 'users') // Assuming users is a relation
        .leftJoinAndSelect('company.branches', 'branches')
        .leftJoinAndSelect('branches.address', 'address') // Correctly joining address through branches
        .select([
          'company',
          'users.id',
          'users.firstName',
          'users.lastName',
          'users.email',
          'users.accountType',
          'branches.id',
          'branches.name',
          'address.id', // Select address id or other relevant fields as needed
          'address.name', // Add other fields from Address you want to select
          'address.location', // Include the location field if necessary
        ])
        .where('company.id = :id', { id: companyId })
        .getOne();

      return company;
    } catch (error) {
      throw error;
    }
  }

  async getCompanyByCuit(cuit: number) {
    try {
      const company = await this.companyRepository.findOne({
        where: { cuit: cuit },
      });

      if (!company) {
        throw new NotFoundException(
          `${ErrorMessages.COMPANY_NOT_FOUND} for cuit ${cuit}`,
        );
      }

      return company;
    } catch (error) {
      throw error;
    }
  }

  async getCompanyByUserId(user: User): Promise<Company> {
    try {
      const company = await this.companyRepository
        .createQueryBuilder('company')
        .leftJoinAndSelect('company.users', 'users')
        .leftJoinAndSelect('company.branches', 'branches') // Join branches
        .leftJoinAndSelect('branches.address', 'address') // Join address through branches
        .select([
          'company',
          'users.id',
          'users.firstName', // Include additional user fields as necessary
          'users.lastName',
          'users.email',
          'branches.id',
          'branches.name',
          'address.id',
          'address.name',
          'address.location',
        ])
        .where('company.id = :id', { id: user.company.id })
        .getOne();

      if (!company) {
        throw new NotFoundException(
          `${ErrorMessages.COMPANY_NOT_FOUND} for user ${user.id}`,
        );
      }

      return company;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async updateCompany(id: UUID, body: UpdateCompanyDto) {
    try {
      // Find the company along with its branches (including the address in each branch)
      const company = await this.companyRepository.findOne({
        where: { id },
        relations: ['branches', 'branches.address'], // Load branches and related address
      });

      if (!company) {
        throw new NotFoundException(`${ErrorMessages.COMPANY_NOT_FOUND} ${id}`);
      }

      // Update company properties
      company.name = body.name;
      company.activity = body.activity;

      if (body.branch) {
        const { id: branchId, name, email, phoneNumber, address } = body.branch;

        // Check if the branch exists, or create a new one
        let branch = company.branches.find((b) => b.id === branchId);

        if (!branch) {
          // Create new branch if it doesn't exist
          branch = new Branch();
          branch.company = company; // Link branch to company
        }

        // Update branch details
        if (name) branch.name = name;
        if (email) branch.email = email;
        if (phoneNumber) branch.phoneNumber = phoneNumber;

        if (address) {
          const { id: locationId, location, ...addressData } = address;

          // Convert coordinates to PostGIS format
          const postGISPolygon = location
            ? convertCoordinatesForPostGIS(location.coordinates)
            : undefined;

          const updatedAddressData = {
            ...addressData,
            location: postGISPolygon,
          };

          // Check if an address with the given locationId exists
          let branchAddress = await this.addressRepository.findOne({
            where: { locationId },
          });

          if (branchAddress) {
            // Update existing address
            branchAddress = { ...branchAddress, ...updatedAddressData };
            branchAddress = await this.addressRepository.save(branchAddress);
          } else {
            // Create a new address if it does not exist
            branchAddress = await this.addressRepository.save({
              locationId,
              ...updatedAddressData,
            });
          }

          // Link the address to the branch
          branch.address = branchAddress;
        }

        // Add or update the branch in the company’s branches
        company.branches = company.branches.some((b) => b.id === branch.id)
          ? company.branches.map((b) => (b.id === branch.id ? branch : b))
          : [...company.branches, branch];
      }

      // Save the updated company (cascades to branch and address)
      await this.companyRepository.save(company);

      // Return the updated company with its branches and addresses
      const updatedCompany = await this.companyRepository.findOne({
        where: { id },
        relations: ['branches', 'branches.address'], // Load branches with addresses
      });

      return updatedCompany;
    } catch (error) {
      console.log(error);
      if (error.code === '23502') {
        throw new NotFoundException(`${ErrorMessages.BRANCH_NOT_FOUND} ${id}`);
      } else {
        throw error;
      }
    }
  }
}
