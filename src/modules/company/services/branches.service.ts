import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Branch } from '../entities/branch.entity';
import { Company } from 'src/modules/company/entities/company.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Address } from 'src/modules/company/entities/address.entity';
import { UUID } from 'crypto';
import { ErrorMessages } from 'src/common/enum';
import { convertCoordinatesForPostGIS } from 'src/common/utils/postGis.utils';
import {
  BranchesResponseDto,
  CreateBranchDto,
  UpdateBranchDto,
} from 'src/modules/company/dto';

@Injectable()
export class BranchService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
  ) {}

  async createBranch(
    companyId: string,
    createBranchDto: CreateBranchDto,
  ): Promise<Omit<Branch, 'company'>> {
    try {
      const company = await this.companyRepository.findOne({
        where: { id: companyId as UUID },
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
      address.location = convertCoordinatesForPostGIS(
        createBranchDto.address.location.coordinates,
      );

      const savedAddress = await this.addressRepository.save(address);
      const branch = new Branch();
      branch.name = createBranchDto.name;
      branch.email = createBranchDto.email;
      branch.phoneNumber = createBranchDto.phoneNumber;
      branch.isMain = createBranchDto.isMain;
      branch.company = company;
      branch.address = savedAddress;

      const savedBranch = await this.branchRepository.save(branch);

      const branchWithoutCompany = {
        id: savedBranch.id,
        name: savedBranch.name,
        email: savedBranch.email ?? '',
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
        const { id: locationId, location, ...addressData } = body.address;

        // Convert coordinates to PostGIS format
        const postGISPolygon = location
          ? convertCoordinatesForPostGIS(location.coordinates)
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
        where: { id: companyId as UUID },
        relations: ['branches', 'branches.address'], // Load related branches and addresses
      });

      if (!company) {
        throw new NotFoundException('Company not found');
      }

      const branches = await this.branchRepository.find({
        where: { company: { id: companyId as UUID } },
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
            isMain: branch.isMain,
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
