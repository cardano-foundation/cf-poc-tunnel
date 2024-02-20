import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

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
}