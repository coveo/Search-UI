import { FacetValueState } from './FacetValueState';
import { FacetSortCriteria } from './FacetSortCriteria';

export interface IFacetRequestValue {
  value: string;
  state?: FacetValueState;
}

export interface IFacetRequest {
  field: string;
  sortCriteria?: FacetSortCriteria;
  numberOfValues?: number;
  injectionDepth?: number;
  isSticky?: boolean;
  currentValues?: IFacetRequestValue[];
}
