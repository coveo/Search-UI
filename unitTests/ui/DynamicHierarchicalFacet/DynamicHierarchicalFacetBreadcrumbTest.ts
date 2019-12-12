import { DynamicHierarchicalFacet } from '../../../src/ui/DynamicHierarchicalFacet/DynamicHierarchicalFacet';
import { DynamicHierarchicalFacetBreadcrumb } from '../../../src/ui/DynamicHierarchicalFacet/DynamicHierarchicalFacetBreadcrumb';
import { DynamicHierarchicalFacetTestUtils } from './DynamicHierarchicalFacetTestUtils';
import { $$ } from '../../../src/Core';
import { analyticsActionCauseList } from '../../../src/ui/Analytics/AnalyticsActionListMeta';

export function DynamicHierarchicalFacetBreadcrumbTest() {
  describe('DynamicHierarchicalFacetBreadcrumb', () => {
    let facet: DynamicHierarchicalFacet;
    let breadcrumbs: DynamicHierarchicalFacetBreadcrumb;

    beforeEach(() => {
      initializeComponent();
    });

    function initializeComponent() {
      facet = DynamicHierarchicalFacetTestUtils.createAdvancedFakeFacet().cmp;
      facet.values.createFromResponse(DynamicHierarchicalFacetTestUtils.getCompleteFacetResponse(facet));
      facet.selectPath(['test', 'allo']);
      breadcrumbs = new DynamicHierarchicalFacetBreadcrumb(facet);
    }

    function titleElement() {
      return $$(breadcrumbs.element).find('.coveo-dynamic-facet-breadcrumb-title');
    }

    function valueElement() {
      return $$(breadcrumbs.element).find('.coveo-dynamic-facet-breadcrumb-value');
    }

    it('should create a title', () => {
      expect(titleElement().innerText).toBe(`${facet.options.title}:`);
    });

    it('should create a value with the right path', () => {
      expect(valueElement().innerText).toBe('test / allo');
    });

    it(`when clicking on a breadcrumb value element
      it should clear the facet value`, () => {
      spyOn(facet, 'clear');
      $$(valueElement()).trigger('click');

      expect(facet.clear).toHaveBeenCalled();
    });

    it(`when clicking on a breadcrumb value element
      it should trigger a new query`, () => {
      spyOn(facet, 'triggerNewQuery');
      $$(valueElement()).trigger('click');
      expect(facet.triggerNewQuery).toHaveBeenCalled();
    });

    it(`when clicking on a breadcrumb value element
      it should log an analytics event`, () => {
      spyOn(facet, 'logAnalyticsEvent');
      facet.triggerNewQuery = beforeExecuteQuery => {
        beforeExecuteQuery();
      };

      $$(valueElement()).trigger('click');
      expect(facet.logAnalyticsEvent).toHaveBeenCalledWith(analyticsActionCauseList.breadcrumbFacet);
    });
  });
}
