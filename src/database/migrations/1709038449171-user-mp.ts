import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserMp1709038449171 implements MigrationInterface {
  name = 'UserMp1709038449171';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "mercado_pago_entity" ("created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "transaction" character varying NOT NULL, CONSTRAINT "PK_5dc751dbc37a41c649a82b467de" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_transaction" ON "mercado_pago_entity" ("transaction") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_roles_enum" AS ENUM('USER', 'ADMIN')`,
    );
    await queryRunner.query(
      `CREATE TABLE "user" ("created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "first_name" character varying NOT NULL, "last_name" character varying NOT NULL, "phone_number" character varying NOT NULL, "password" character varying NOT NULL, "account_verified" boolean NOT NULL DEFAULT false, "activation_code" character varying, "roles" "public"."user_roles_enum" array NOT NULL DEFAULT '{USER}', CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_user_email" ON "user" ("email") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_phone_number" ON "user" ("phone_number") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."UQ_phone_number"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_user_email"`);
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TYPE "public"."user_roles_enum"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_transaction"`);
    await queryRunner.query(`DROP TABLE "mercado_pago_entity"`);
  }
}
