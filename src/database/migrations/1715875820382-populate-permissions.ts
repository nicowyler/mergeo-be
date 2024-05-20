import { PERMISSIONS } from '../../common/enum/permissions.enum';
import { Permission } from '../../modules/role/permission.entity';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class PopulatePermissions1715875820382 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create permissions based on values in the PERMISSIONS enum
    const permissions = Object.values(PERMISSIONS).map((permissionName) => {
      const permission = new Permission();
      permission.name = permissionName;
      return permission;
    });

    // Insert permissions into the database
    await queryRunner.manager.save(permissions);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.manager.delete(Permission, {});
  }
}
