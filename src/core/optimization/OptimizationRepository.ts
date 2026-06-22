import type { OptimizationDefinition, OptimizationId } from "../../types/optimization";
import { KnowledgeRepository, knowledgeToOptimizationDefinition } from "../knowledge/KnowledgeRepository";

export class OptimizationRepository {
  static getAll(): OptimizationDefinition[] {
    return KnowledgeRepository.getAll().map(knowledgeToOptimizationDefinition);
  }

  static getById(id: OptimizationId): OptimizationDefinition | undefined {
    const knowledge = KnowledgeRepository.getById(id);
    return knowledge ? knowledgeToOptimizationDefinition(knowledge) : undefined;
  }

  static getDefault(): OptimizationDefinition {
    return this.getAll()[0];
  }
}
