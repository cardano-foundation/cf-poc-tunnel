import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Session {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  aid: string;

  @Column()
  role: string;

  @Column()
  validUntil: Date;

  @Column()
  lei: string;  // @TODO - foconnor: This shouldn't be in the session table but OK for PoC.
}
