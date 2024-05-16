import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Company } from '@/modules/company/company.entity';
import { CreateCompanyDto, UpdateCompanyDto } from '@/modules/company/dto';
import { ErrorMessages } from '@/common/enum/errorMessages.enum';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  createCompany(body: CreateCompanyDto) {
    const company = this.companyRepository.create({
      ...body,
    });
    return this.companyRepository.save(company);
  }

  async getCompanyById(companyId: string) {
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
}
