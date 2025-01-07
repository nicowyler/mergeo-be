import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Unit } from 'src/modules/product/entities/unit.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UnitService {
  private readonly logger = new Logger(UnitService.name);

  constructor(
    @InjectRepository(Unit)
    private readonly unitRepository: Repository<Unit>,
  ) {}

  async normalizeName(name: string): Promise<string> {
    this.logger.log(`Normalizando nombre de unidad: ${name}`);
    const normalizedName = name.toLowerCase();

    // Buscar si el nombre existe en el array `aliases`
    const unit = await this.unitRepository
      .createQueryBuilder('unit')
      .where('LOWER(:name) = ANY(ARRAY(SELECT LOWER(unnest(unit.aliases))))', {
        name: normalizedName,
      })
      .getOne();

    if (unit) {
      this.logger.log(`Nombre normalizado: ${unit.standardName}`);
      return unit.standardName; // Devolver el nombre estándar si existe
    }

    throw new Error(`No se encontró una equivalencia para: ${name}`);
  }
}
