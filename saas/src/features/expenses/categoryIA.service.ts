import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../category/category.entity';
import { Expense } from './expenses.entity';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

const ML_SERVICE_BASE_URL = (
  process.env.ML_SERVICE_URL ?? 'http://localhost:5001'
).replace(/\/+$/, '');

@Injectable()
export class CategoryIAService {
  private readonly logger = new Logger(CategoryIAService.name);
  private readonly keywordMap: { category: string; keywords: string[] }[] = [
    {
      category: 'Alimentacao',
      keywords: [
        'ifood',
        'ubereats',
        'delivery',
        'restaurante',
        'lanchonete',
        'padaria',
        'pizzaria',
        'burger',
        'bar',
        'cafe',
        'cafeteria',
      ],
    },
    {
      category: 'Transporte',
      keywords: [
        'uber',
        '99',
        'taxi',
        'gasolina',
        'combustivel',
        'metro',
        'onibus',
        'estacionamento',
        'pedagio',
      ],
    },
    {
      category: 'Saude',
      keywords: [
        'farmacia',
        'drogaria',
        'medico',
        'consulta',
        'exame',
        'laboratorio',
        'clinica',
        'hospital',
        'dentista',
      ],
    },
    {
      category: 'Mercado',
      keywords: ['supermercado', 'mercado', 'atacadao', 'hortifruti', 'feira'],
    },
    {
      category: 'Moradia',
      keywords: ['aluguel', 'condominio', 'iptu', 'imovel'],
    },
    {
      category: 'Contas',
      keywords: ['luz', 'energia', 'agua', 'gas', 'internet', 'telefone'],
    },
    {
      category: 'Lazer',
      keywords: ['cinema', 'netflix', 'spotify', 'show', 'viagem', 'parque'],
    },
    {
      category: 'Educacao',
      keywords: ['curso', 'faculdade', 'escola', 'livro', 'mensalidade'],
    },
    {
      category: 'Vestuario',
      keywords: ['roupa', 'tenis', 'sapato', 'loja', 'calcado'],
    },
    {
      category: 'Servicos',
      keywords: ['barbearia', 'salao', 'lavanderia', 'manutencao', 'oficina'],
    },
    {
      category: 'Pets',
      keywords: ['pet', 'veterinario', 'racao', 'petshop'],
    },
    {
      category: 'Assinaturas',
      keywords: [
        'prime',
        'assinatura',
        'mensalidade',
        'office',
        'google drive',
      ],
    },
    {
      category: 'Impostos',
      keywords: ['taxa', 'multa', 'imposto'],
    },
    {
      category: 'Transferencias',
      keywords: ['pix', 'transferencia', 'ted', 'doc'],
    },
    {
      category: 'Investimentos',
      keywords: ['corretora', 'tesouro', 'aplicacao', 'aporte'],
    },
  ];

  constructor(
    @InjectRepository(Expense)
    private readonly expensesRepository: Repository<Expense>,

    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,

    private readonly httpService: HttpService,
  ) {}

  async classify(
    userId: number,
    description: string,
  ): Promise<Category | null> {
    const desc = this.normalizeText(description);

    const previous = await this.expensesRepository.findOne({
      where: { user: { id: userId }, description: desc },
      order: { date: 'DESC' },
      relations: ['category'],
    });
    if (previous) return previous.category;

    // 2️⃣ Heurística rápida por palavras-chave
    const keywordCategory = this.matchByKeywords(desc);
    if (keywordCategory) {
      return await this.findOrCreateCategory(userId, keywordCategory);
    }

    // 2️⃣ Chama o serviço externo para prever categoria
    let categoryName: string;
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${ML_SERVICE_BASE_URL}/classify`, {
          text: desc,
        }),
      );
      // O serviço externo retorna { category: "Nome da Categoria" }

      categoryName = response.data.category;
    } catch (error) {
      this.logger.error('Error classifying expense:', error);
      const fallback = keywordCategory ?? 'Outros';
      return await this.findOrCreateCategory(userId, fallback);
    }

    const normalizedCategoryName = this.normalizeCategoryName(categoryName);
    return await this.findOrCreateCategory(userId, normalizedCategoryName);
  }

  /**
   * Metodo de fallback para prever categoria sem IA externa.
   */
  async predictCategory(userId: number, text: string): Promise<string> {
    const desc = this.normalizeText(text);
    const keywordCategory = this.matchByKeywords(desc);
    return keywordCategory ?? 'Outros';
  }

  private normalizeText(text: string): string {
    const value = text.trim().toLowerCase();
    return value
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ');
  }

  private normalizeCategoryName(name: string): string {
    const normalized = this.normalizeText(name);
    const map: Record<string, string> = {
      alimentacao: 'Alimentacao',
      alimento: 'Alimentacao',
      transporte: 'Transporte',
      saude: 'Saude',
      mercado: 'Mercado',
      moradia: 'Moradia',
      contas: 'Contas',
      lazer: 'Lazer',
      educacao: 'Educacao',
      vestuario: 'Vestuario',
      servicos: 'Servicos',
      pets: 'Pets',
      viagem: 'Viagem',
      assinaturas: 'Assinaturas',
      impostos: 'Impostos',
      transferencias: 'Transferencias',
      investimentos: 'Investimentos',
      outros: 'Outros',
    };
    return map[normalized] ?? this.titleCase(normalized);
  }

  private titleCase(value: string): string {
    return value
      .split(' ')
      .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
      .join(' ');
  }

  private matchByKeywords(text: string): string | null {
    for (const entry of this.keywordMap) {
      if (entry.keywords.some((k) => text.includes(k))) {
        return entry.category;
      }
    }
    return null;
  }

  private async findOrCreateCategory(
    userId: number,
    categoryName: string,
  ): Promise<Category> {
    let category = await this.categoryRepository.findOne({
      where: { name: categoryName, user: { id: userId } },
    });
    if (!category) {
      category = this.categoryRepository.create({
        name: categoryName,
        user: { id: userId },
      });
      await this.categoryRepository.save(category);
    }
    return category;
  }
}

