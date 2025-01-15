import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UUID } from 'crypto';
import { Company } from 'src/modules/company/entities/company.entity';
import { BlackListService } from 'src/modules/product/services/blacklist.service';
import { ClientBlackList } from 'src/modules/company/entities/client-black-list.entity';
import { ErrorMessages } from 'src/common/enum';

@Injectable()
export class ClientBlackListService {
  private readonly logger = new Logger(ClientBlackListService.name);

  constructor(
    @InjectRepository(ClientBlackList)
    private readonly clientBlackListRepository: Repository<ClientBlackList>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly productBlackListService: BlackListService,
  ) {}

  async find(companyId: UUID): Promise<ClientBlackList> {
    const clientBlackList = await this.clientBlackListRepository.findOne({
      where: { company: { id: companyId } },
      relations: ['company'],
    });

    if (!clientBlackList) {
      throw new NotFoundException(
        `${ErrorMessages.COMPANY_NOT_FOUND} ${companyId}`,
      );
    }

    return clientBlackList;
  }

  async add(companyId: UUID): Promise<ClientBlackList> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
      relations: ['products'],
    });

    if (!company) {
      throw new NotFoundException(
        `${ErrorMessages.COMPANY_NOT_FOUND} ${companyId}`,
      );
    }

    this.logger.log(`Adding company to blacklist: ${company.name}`);

    await this.productBlackListService.addMultipleProducts(
      companyId,
      company.products,
    );

    let clientBlackList = await this.clientBlackListRepository.findOne({
      where: { id: company.id },
    });

    if (!clientBlackList) {
      clientBlackList = this.clientBlackListRepository.create({
        company: company,
      });
      clientBlackList = await this.clientBlackListRepository.save(
        clientBlackList,
      );
    }

    return clientBlackList;
  }

  async remove(companyId: UUID): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
      relations: ['products'],
    });

    if (!company) {
      throw new NotFoundException(
        `${ErrorMessages.COMPANY_NOT_FOUND} ${companyId}`,
      );
    }

    this.logger.log(`Removing company from blacklist: ${company.name}`);

    await this.productBlackListService.removeMultipleProducts(
      companyId,
      company.products,
    );

    await this.clientBlackListRepository.delete({ id: companyId });
    return company;
  }
}
