import { Injectable, OnApplicationBootstrap, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CurrencyRate } from './entities/currency-rate.entity';
import { CreateCurrencyRateDto } from './dto/create-currency-rate.dto';

const TARGET_CURRENCIES = ['USD', 'EUR', 'GBP', 'SAR', 'AED'];
const FALLBACK_RATES: Record<string, number> = {
  USD: 0.0175,
  EUR: 0.0162,
  GBP: 0.0139,
  SAR: 0.0657,
  AED: 0.0643,
};

@Injectable()
export class CurrencyService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CurrencyService.name);

  constructor(
    @InjectRepository(CurrencyRate)
    private readonly repo: Repository<CurrencyRate>,
  ) {}

  async onApplicationBootstrap() {
    await this.refreshRates();
  }

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async refreshRatesCron() {
    this.logger.log('Running daily currency rate refresh...');
    await this.refreshRates();
  }

  async refreshRates(): Promise<{ source: string; updated: number }> {
    // Attempt live fetch from external API
    const apiKey = process.env.EXCHANGE_RATE_API_KEY;
    let rates: Record<string, number> | null = null;
    let source = '';

    if (apiKey) {
      rates = await this.fetchFromExchangeRateApi(apiKey);
      if (rates) source = 'exchangerate-api.com';
    }

    if (!rates) {
      rates = await this.fetchFromOpenErApi();
      if (rates) source = 'open.er-api.com';
    }

    if (!rates) {
      // Fallback to hardcoded defaults — seed if DB is empty
      const count = await this.repo.count();
      if (count === 0) {
        this.logger.warn('No external rate API available, using fallback rates');
        for (const [to, rate] of Object.entries(FALLBACK_RATES)) {
          await this.upsertRate('ETB', to, rate);
        }
      }
      return { source: 'fallback', updated: 0 };
    }

    // Upsert fetched rates into DB
    const now = new Date();
    for (const [to, rate] of Object.entries(rates)) {
      if (!TARGET_CURRENCIES.includes(to)) continue;
      await this.upsertRate('ETB', to, rate, now);
    }

    this.logger.log(`Currency rates updated from ${source}`);
    return { source, updated: rates ? Object.keys(rates).length : 0 };
  }

  private async fetchFromExchangeRateApi(apiKey: string): Promise<Record<string, number> | null> {
    try {
      const res = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/ETB`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return null;
      const data: any = await res.json();
      return data?.conversion_rates || null;
    } catch (e) {
      this.logger.warn(`exchangerate-api.com fetch failed: ${(e as Error).message}`);
      return null;
    }
  }

  private async fetchFromOpenErApi(): Promise<Record<string, number> | null> {
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/ETB', {
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return null;
      const data: any = await res.json();
      return data?.rates || null;
    } catch (e) {
      this.logger.warn(`open.er-api.com fetch failed: ${(e as Error).message}`);
      return null;
    }
  }

  private async upsertRate(from: string, to: string, rate: number, lastFetchedAt?: Date) {
    const existing = await this.repo.findOne({ where: { fromCurrency: from, toCurrency: to } });
    const data = { rate, lastFetchedAt: lastFetchedAt || new Date() };
    if (existing) {
      await this.repo.update(existing.id, data);
    } else {
      await this.repo.save(this.repo.create({ fromCurrency: from, toCurrency: to, ...data }));
    }
  }

  async findAll(): Promise<CurrencyRate[]> {
    return this.repo.find({ order: { fromCurrency: 'ASC', toCurrency: 'ASC' } });
  }

  async convert(
    from: string,
    to: string,
    amount: number,
  ): Promise<{ from: string; to: string; amount: number; result: number; rate: number }> {
    if (from === to) {
      return { from, to, amount, result: amount, rate: 1 };
    }
    const rate = await this.repo.findOne({ where: { fromCurrency: from, toCurrency: to } });
    if (!rate) {
      throw new BadRequestException(`No exchange rate found for ${from} → ${to}. Try refreshing rates first.`);
    }
    const numericRate = Number(rate.rate);
    return {
      from,
      to,
      amount,
      result: Math.round(amount * numericRate * 100) / 100,
      rate: numericRate,
    };
  }

  async create(dto: CreateCurrencyRateDto): Promise<CurrencyRate> {
    const existing = await this.repo.findOne({
      where: { fromCurrency: dto.fromCurrency, toCurrency: dto.toCurrency },
    });
    if (existing) {
      existing.rate = dto.rate;
      return this.repo.save(existing);
    }
    const rate = this.repo.create(dto);
    return this.repo.save(rate);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
