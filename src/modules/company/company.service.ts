import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Address, Company } from '../../modules/company/company.entity';
import {
  BranchesResponseDto,
  CreateBranchDto,
  CreateBranchResponseDto,
  CreateCompanyDto,
  UpdateBranchDto,
  UpdateCompanyDto,
} from '../../modules/company/dto';
import { ErrorMessages } from '../../common/enum/errorMessages.enum';
import { Branch } from '../../modules/company/branch.entity';
import { UUID } from 'crypto';
import { plainToInstance } from 'class-transformer';
import { User } from 'src/modules/user/user.entity';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
  ) {}

  async createCompany(body: CreateCompanyDto) {
    console.log(body);
    const newAddress = new Address();
    newAddress.name = body.address.displayName.text;
    newAddress.polygon = {
      type: 'Point',
      coordinates: [
        body.address.location.longitude,
        body.address.location.latitude,
      ],
    };

    const newCompany = new Company();
    newCompany.name = body.name;
    newCompany.razonSocial = body.razonSocial;
    newCompany.cuit = parseInt(body.cuit);
    newCompany.address = newAddress;
    newCompany.activity = body.activity;

    try {
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
    const companyExists = await this.companyRepository.findOneBy({
      id: companyId,
    });
    if (!companyExists) {
      throw new NotFoundException(
        `${ErrorMessages.COMPANY_NOT_FOUND} ${companyId}`,
      );
    }
    try {
      const company = await this.companyRepository
        .createQueryBuilder('company')
        .leftJoinAndSelect('company.users', 'users')
        .select([
          'company',
          'users.id',
          'users.firstName',
          'users.lastName',
          'users.email',
          'users.accountType',
        ])
        .where('company.id = :id', { id: companyId })
        .getOne();

      return company;
    } catch (error) {
      console.log(error);
      return error;
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

  async updateCompany(companyId: string, body: UpdateCompanyDto) {
    try {
      const company = await this.companyRepository.save({
        id: companyId,
        ...body,
      });
      return company;
    } catch (error) {
      if (error.code === '23502') {
        throw new NotFoundException(
          `${ErrorMessages.COMPANY_NOT_FOUND} ${companyId}`,
        );
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async createBranch(id: UUID, body: CreateBranchDto) {
    // Find the company by ID
    const company = await this.companyRepository.findOneBy({
      id: id,
    });
    if (!company) {
      throw new NotFoundException(`${ErrorMessages.COMPANY_NOT_FOUND} ${id}`);
    }
    try {
      // Create a new branch
      const branch = this.branchRepository.create({ ...body, company });

      // Save the branch
      const savedBranch = await this.branchRepository.save(branch);

      // Transform the saved branch into the response DTO
      const response = plainToInstance(CreateBranchResponseDto, savedBranch, {
        excludeExtraneousValues: true,
      });
      response.company = { id: company.id, name: company.name };

      return response;
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException(ErrorMessages.BRANCH_NAME_TAKEN);
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async updateBranch(id: UUID, body: UpdateBranchDto) {
    try {
      const branch = await this.branchRepository.save({ id, ...body });
      return branch;
    } catch (error) {
      if (error.code === '23502') {
        throw new NotFoundException(`${ErrorMessages.BRANCH_NOT_FOUND} ${id}`);
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async getBranches(companyId: UUID) {
    // Find the company by ID
    const company = await this.companyRepository.findOneBy({
      id: companyId,
    });
    if (!company) {
      throw new NotFoundException(
        `${ErrorMessages.COMPANY_NOT_FOUND} ${companyId}`,
      );
    }
    // Fetch all branches associated with the company
    const branches = await this.branchRepository
      .createQueryBuilder('branch')
      .leftJoinAndSelect('branch.company', 'company')
      .select(['branch.id', 'branch.name', 'company.id', 'company.name'])
      .where('company.id = :companyId', { companyId })
      .getMany();

    const result: BranchesResponseDto = {
      company: {
        id: company.id,
        name: company.name,
        branches: branches.map((branch) => ({
          id: branch.id,
          name: branch.name,
        })),
      },
    };

    return result;
  }
}
