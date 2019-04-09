import { IQueryResult } from '../../rest/QueryResult';
import { IFieldsToMatch } from './Template';
import { each, isArray } from 'underscore';

export class TemplateFieldsEvaluator {
  public static evaluateFieldsToMatch(toMatches: IFieldsToMatch[], result: IQueryResult): boolean {
    let templateShouldBeLoaded = true;
    each(toMatches, (toMatch: IFieldsToMatch) => {
      let matchAtLeastOnce = false;
      if (!toMatch.values) {
        matchAtLeastOnce = result.raw[toMatch.field] != null;
      } else {
        each(toMatch.values, value => {
          if (!matchAtLeastOnce) {
            const fieldValue: string | string[] = result.raw[toMatch.field];
            const fieldValues = TemplateFieldsEvaluator.getFieldValueAsArray(fieldValue);
            matchAtLeastOnce = TemplateFieldsEvaluator.isMatch(fieldValues, value);
          }
        });
      }
      templateShouldBeLoaded = templateShouldBeLoaded && matchAtLeastOnce;
    });
    return templateShouldBeLoaded;
  }

  private static getFieldValueAsArray(fieldValue: string | string[]): string[] {
    if (typeof fieldValue === 'string') {
      return [fieldValue];
    }

    if (isArray(fieldValue)) {
      return fieldValue;
    }

    return [];
  }

  private static isMatch(fieldValues: string[], value: string) {
    return fieldValues.map(fieldValue => fieldValue.toLowerCase()).indexOf(value.toLowerCase()) !== -1;
  }
}
