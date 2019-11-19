import { DynamicFacetRangeQueryController } from '../../src/controllers/DynamicFacetRangeQueryController';
import { DynamicFacetRangeTestUtils } from '../ui/DynamicFacet/DynamicFacetRangeTestUtils';
import { DynamicFacetRange } from '../../src/ui/DynamicFacet/DynamicFacetRange';
import { IDynamicFacetRangeOptions } from '../../src/ui/DynamicFacet/DynamicFacetRangeInterface';

export function DynamicFacetRangeQueryControllerTest() {
  describe('DynamicFacetRangeQueryController', () => {
    let facet: DynamicFacetRange;
    let facetOptions: IDynamicFacetRangeOptions;
    let dynamicFacetRangeQueryController: DynamicFacetRangeQueryController;
    let ranges = DynamicFacetRangeTestUtils.createFakeRanges();

    beforeEach(() => {
      facetOptions = { field: '@field', ranges };

      initializeComponents();
    });

    function initializeComponents() {
      facet = DynamicFacetRangeTestUtils.createAdvancedFakeFacet(facetOptions).cmp;
      dynamicFacetRangeQueryController = new DynamicFacetRangeQueryController(facet);
    }

    function facetRequest() {
      return dynamicFacetRangeQueryController.facetRequest;
    }

    function facetValues() {
      return facet.values.allFacetValues;
    }

    it('should send the current values', () => {
      const currentValues = facetRequest().currentValues;
      const facetValue = facetValues()[0];
      expect(currentValues[0]).toEqual({
        start: facetValue.start,
        end: facetValue.end,
        endInclusive: facetValue.endInclusive,
        state: facetValue.state
      });
    });

    describe('when there are values', () => {
      it('freezeCurrentValues should be true', () => {
        expect(facetRequest().freezeCurrentValues).toBe(true);
      });

      it('numberOfValues should be equal to the number of current values', () => {
        expect(facetRequest().numberOfValues).toBe(facetRequest().currentValues.length);
      });
    });

    describe('when there no values', () => {
      beforeEach(() => {
        facet.values.resetValues();
      });

      it('freezeCurrentValues should be false', () => {
        expect(facetRequest().freezeCurrentValues).toBe(false);
      });

      it('numberOfValues should be equal to the numberOfValues option', () => {
        expect(facetRequest().numberOfValues).toBe(facet.options.numberOfValues);
      });
    });
  });
}
