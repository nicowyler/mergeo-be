import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
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

  /**
   * Finds a client's blacklist by the given company ID.
   *
   * @param {UUID} companyId - The unique identifier of the company.
   * @returns {Promise<ClientBlackList>} A promise that resolves to the client's blacklist.
   * @throws {NotFoundException} If the blacklist is not found for the given company ID.
   */
  async find(companyId: UUID): Promise<ClientBlackList> {
    const blacklist = await this.clientBlackListRepository.findOne({
      where: { owner: { id: companyId } },
      relations: ['companies'],
    });

    if (!blacklist) {
      throw new NotFoundException(
        `${ErrorMessages.BLACKLIST_NOT_FOUND}: ${companyId}`,
      );
    }
    return blacklist;
  }

  /**
   * Adds a company and its products to the blacklist of the owner company.
   *
   * @param ownerCompanyId - The UUID of the owner company.
   * @param blackListCompanyId - The UUID of the company to be added to the blacklist.
   * @returns A promise that resolves to the updated ClientBlackList.
   * @throws {BadRequestException} If the blackListCompanyId is not provided or if the company to be added is the same as the owner company.
   * @throws {NotFoundException} If the owner company is not found.
   */
  async add(
    ownerCompanyId: UUID,
    blackListCompaniesId: UUID[],
  ): Promise<ClientBlackList> {
    if (blackListCompaniesId.length === 0) {
      throw new BadRequestException(
        'No se han proporcionado empresas para agregar a la blacklist',
      );
    }

    // Find or create the blacklist for the owner company
    let blacklist = await this.clientBlackListRepository.findOne({
      where: { owner: { id: ownerCompanyId } },
      relations: ['companies'],
    });

    if (!blacklist) {
      const owner = await this.companyRepository.findOne({
        where: { id: ownerCompanyId },
      });

      if (!owner) {
        throw new NotFoundException(
          `Company with ID ${ownerCompanyId} not found`,
        );
      }

      blacklist = this.clientBlackListRepository.create({
        owner,
        companies: [], // Initialize with an empty list of companies
      });
    }

    // Process each company ID in the blackListCompaniesId array
    for (const companyId of blackListCompaniesId) {
      if (companyId === ownerCompanyId) {
        throw new BadRequestException(
          'No se puede agregar la empresa propietaria a la blacklist',
        );
      }

      const company = await this.companyRepository.findOne({
        where: { id: companyId },
        relations: ['products'],
      });

      if (!company) {
        throw new NotFoundException(`Company with ID ${companyId} not found`);
      }

      // Add products of the blacklisted company to the product blacklist
      await this.productBlackListService.addProducts(
        ownerCompanyId,
        company.products,
      );

      this.logger.log(
        `Company with id: ${company.id} and products: ${JSON.stringify(
          company.products,
        )} added to blacklist`,
      );

      // Add the company to the blacklist if not already present
      if (!blacklist.companies.some((c) => c.id === company.id)) {
        blacklist.companies.push(company);
      }
    }

    // Save and return the updated blacklist
    return this.clientBlackListRepository.save(blacklist);
  }

  /**
   * Removes specified companies and its products from the blacklist of the owner company.
   *
   * @param ownerCompanyId - The UUID of the owner company whose blacklist is to be modified.
   * @param companyIdsToRemove - An array of UUIDs of the companies to be removed from the blacklist.
   * @returns A promise that resolves to the updated ClientBlackList.
   * @throws NotFoundException - If the blacklist for the owner company is not found.
   */
  async remove(
    ownerCompanyId: UUID,
    companyIdsToRemove: UUID[],
  ): Promise<ClientBlackList> {
    // Find the blacklist for the owner company
    const blacklist = await this.clientBlackListRepository.findOne({
      where: { owner: { id: ownerCompanyId } },
      relations: ['companies'],
    });

    if (!blacklist) {
      throw new NotFoundException(
        `Blacklist for owner company with ID ${ownerCompanyId} not found`,
      );
    }

    if (blacklist.companies.length !== 0) {
      await this.findCompaniesAndRemoeProducts(
        ownerCompanyId,
        blacklist.companies,
      );
    }

    // Filter out the companies to be removed
    blacklist.companies = blacklist.companies.filter(
      (company) => !companyIdsToRemove.includes(company.id),
    );

    // Save the updated blacklist
    return await this.clientBlackListRepository.save(blacklist);
  }

  /**
   * Finds companies and removes their products from the blacklist.
   *
   * @param ownerCompanyId - The UUID of the owner company.
   * @param companies - An array of companies to process.
   * @returns A promise that resolves when the operation is complete.
   */
  private async findCompaniesAndRemoeProducts(
    ownerCompanyId: UUID,
    companies: Company[],
  ) {
    companies.map(async (company: Company) => {
      const companyEntity = await this.companyRepository.findOne({
        where: { id: company.id },
        relations: ['products'],
      });

      await this.productBlackListService.removeProducts(
        ownerCompanyId,
        companyEntity.products,
      );
    });
  }
}
