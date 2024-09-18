import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Company } from '../company.entity';
import { ErrorMessages } from '../../../common/enum/errorMessages.enum';
import { UUID } from 'crypto';
import { DropZone } from 'src/modules/company/dropZones/dropZone.entity';
import { DropZoneSchedule } from 'src/modules/company/dropZones/dropZoneSchedule.entity';
import {
  DropZoneDto,
  UpdateDropZoneDto,
} from 'src/modules/company/dto/DropZone.dto';

@Injectable()
export class DropZoneService {
  constructor(
    @InjectRepository(DropZone)
    private readonly dropZoneRepository: Repository<DropZone>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(DropZoneSchedule)
    private readonly dropZoneScheduleRepository: Repository<DropZoneSchedule>,
  ) {}

  async create(
    companyId: string,
    dropZoneDto: DropZoneDto,
  ): Promise<Omit<DropZone, 'company'>> {
    try {
      const company = await this.companyRepository.findOne({
        where: { id: companyId },
        relations: ['dropZones'],
      });

      if (!company) {
        throw new NotFoundException(
          `${ErrorMessages.COMPANY_NOT_FOUND} ${companyId}`,
        );
      }

      // Ensure the zone is valid GeoJSON
      const dropzone = new DropZone();
      dropzone.name = dropZoneDto.name;
      dropzone.company = company;
      dropzone.zone = dropZoneDto.zone;

      const savedDropZone = await this.dropZoneRepository.save(dropzone);

      let schedules = [];
      if (dropZoneDto.schedules && dropZoneDto.schedules.length) {
        schedules = dropZoneDto.schedules.map((scheduleDto) => {
          const schedule = new DropZoneSchedule();
          schedule.day = scheduleDto.day;
          schedule.startHour = scheduleDto.startHour;
          schedule.endHour = scheduleDto.endHour;
          schedule.dropZone = savedDropZone;
          return schedule;
        });
        await this.dropZoneScheduleRepository.save(schedules);
      }

      return {
        id: savedDropZone.id,
        name: savedDropZone.name,
        zone: savedDropZone.zone,
        schedules: schedules,
      };
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException(ErrorMessages.PDROP_ZONE_NAME_TAKEN);
      } else {
        throw error;
      }
    }
  }

  async update(id: UUID, body: UpdateDropZoneDto) {
    try {
      // Find the branch and its related address
      const dropZone = await this.dropZoneRepository.findOne({
        where: { id },
        relations: ['schedules'],
      });

      if (!dropZone) {
        throw new NotFoundException(
          `${ErrorMessages.DROP_ZONE_NOT_FOUND} ${id}`,
        );
      }

      // Update branch properties
      dropZone.name = body.name ?? dropZone.name;

      const incomingSchedules = body.schedules;
      // Find schedules that need to be removed
      const schedulesToRemove = dropZone.schedules.filter(
        (existingSchedule) =>
          !incomingSchedules.some(
            (schedule) => schedule.id === existingSchedule.id,
          ),
      );

      // Find schedules that need to be added or updated
      const updatedSchedules = incomingSchedules.map((scheduleDto) => {
        let schedule = dropZone.schedules.find((s) => s.id === scheduleDto.id);

        if (!schedule) {
          // Schedule not found, create a new one
          schedule = new DropZoneSchedule();
        }

        // Update fields
        schedule.day = scheduleDto.day;
        schedule.startHour = scheduleDto.startHour;
        schedule.endHour = scheduleDto.endHour;
        return schedule;
      });

      // Remove schedules that are not in the incoming data
      if (schedulesToRemove.length > 0) {
        await this.dropZoneScheduleRepository.remove(schedulesToRemove);
      }

      // Update the schedules
      dropZone.schedules = updatedSchedules;

      if (body.zone) {
        dropZone.zone = body.zone;
      }

      // Save the updated branch
      const updatedDropZone = await this.dropZoneRepository.save(dropZone);
      return updatedDropZone;
    } catch (error) {
      if (error.code === '23502') {
        throw new NotFoundException(
          `${ErrorMessages.DROP_ZONE_NOT_FOUND} ${id}`,
        );
      } else {
        throw error;
      }
    }
  }

  async get(companyId: string): Promise<DropZoneDto[]> {
    try {
      const company = await this.companyRepository.findOne({
        where: { id: companyId },
        relations: ['dropZones', 'dropZones.schedules'], // Load related branches and addresses
      });

      if (!company) {
        throw new NotFoundException(ErrorMessages.COMPANY_NOT_FOUND);
      }

      return company.dropZones;
    } catch (error) {
      throw error;
    }
  }

  async delete(id: string) {
    try {
      const dropZone = await this.dropZoneRepository.find({
        where: { id: id },
        relations: ['schedules'], // Ensure address is included
      });
      if (!dropZone) {
        throw new NotFoundException(ErrorMessages.DROP_ZONE_NOT_FOUND);
      }

      this.dropZoneRepository.remove(dropZone);
    } catch (error) {
      throw error;
    }
  }
}
