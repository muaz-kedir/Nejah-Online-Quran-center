import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('currency_rates')
export class CurrencyRate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 3 })
  fromCurrency: string;

  @Column({ length: 3 })
  toCurrency: string;

  @Column({ type: 'decimal', precision: 14, scale: 6 })
  rate: number;

  @Column({ nullable: true })
  lastFetchedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
