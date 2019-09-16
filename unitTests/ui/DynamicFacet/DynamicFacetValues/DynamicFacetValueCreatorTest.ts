import { DynamicFacetValueCreator } from '../../../../src/ui/DynamicFacet/DynamicFacetValues/DynamicFacetValueCreator';
import { DynamicFacet } from '../../../../src/ui/DynamicFacet/DynamicFacet';
import { DynamicFacetTestUtils } from '../DynamicFacetTestUtils';
import { IFacetResponseValue } from '../../../../src/rest/Facet/FacetResponse';
import { FacetValueState } from '../../../../src/rest/Facet/FacetValueState';
import { DynamicFacetValue } from '../../../../src/ui/DynamicFacet/DynamicFacetValues/DynamicFacetValue';
import { FacetUtils } from '../../../../src/ui/Facet/FacetUtils';

export function DynamicFacetValueCreatorTest() {
  describe('DynamicFacetValueCreator', () => {
    let valueCreator: DynamicFacetValueCreator;
    let facetValue: DynamicFacetValue;
    let facet: DynamicFacet;

    beforeEach(() => {
      initializeComponent();
    });

    function initializeComponent() {
      facet = DynamicFacetTestUtils.createFakeFacet({ valueCaption: { caption: 'this is a value caption' } });
      valueCreator = new DynamicFacetValueCreator(facet);
    }

    describe('testing createFromResponse', () => {
      let index: number;
      let responseValue: IFacetResponseValue;

      beforeEach(() => {
        index = 0;
        responseValue = {
          value: 'allo',
          state: FacetValueState.selected,
          numberOfResults: 34
        };
        initializeValue();
      });

      function initializeValue() {
        facetValue = valueCreator.createFromResponse(responseValue, index);
      }

      it('should have the right basic properties', () => {
        expect(facetValue.value).toBe(responseValue.value);
        expect(facetValue.state).toBe(responseValue.state);
        expect(facetValue.position).toBe(index + 1);
        expect(facetValue.numberOfResults).toBe(responseValue.numberOfResults);
      });

      it(`when there is no value caption
      display value should be equal to the value`, () => {
        expect(facetValue.displayValue).toBe(responseValue.value);
      });

      it(`when there is a value caption
      display value should be equal to the caption for that value`, () => {
        responseValue.value = 'caption';
        initializeValue();
        expect(facetValue.displayValue).toBe('this is a value caption');
      });

      it('should call tryToGetTranslatedCaption from FacetUtils', () => {
        spyOn(FacetUtils, 'tryToGetTranslatedCaption');
        initializeValue();
        expect(FacetUtils.tryToGetTranslatedCaption).toHaveBeenCalled();
      });
    });

    describe('testing createFromValue', () => {
      let value = 'hello friends';

      beforeEach(() => {
        initializeValue();
      });

      function initializeValue() {
        facetValue = valueCreator.createFromValue(value);
      }

      it('should have the right basic properties', () => {
        expect(facetValue.value).toBe(value);
        expect(facetValue.state).toBe(FacetValueState.idle);
        expect(facetValue.position).toBe(1);
        expect(facetValue.numberOfResults).toBe(0);
      });

      it(`when there is no value caption
      display value should be equal to the value`, () => {
        expect(facetValue.displayValue).toBe(value);
      });

      it(`when there is a value caption
      display value should be equal to the caption for that value`, () => {
        value = 'caption';
        initializeValue();
        expect(facetValue.displayValue).toBe('this is a value caption');
      });

      it('should call tryToGetTranslatedCaption from FacetUtils', () => {
        spyOn(FacetUtils, 'tryToGetTranslatedCaption');
        initializeValue();
        expect(FacetUtils.tryToGetTranslatedCaption).toHaveBeenCalled();
      });
    });
  });
}
