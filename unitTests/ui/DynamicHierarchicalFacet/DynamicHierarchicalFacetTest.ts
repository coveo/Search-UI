import * as Mock from '../../MockEnvironment';
import { DynamicHierarchicalFacetTestUtils } from './DynamicHierarchicalFacetTestUtils';
import { DynamicHierarchicalFacet } from '../../../src/ui/DynamicHierarchicalFacet/DynamicHierarchicalFacet';
import { FacetType } from '../../../src/rest/Facet/FacetRequest';
import { IPopulateBreadcrumbEventArgs, BreadcrumbEvents } from '../../../src/events/BreadcrumbEvents';
import { $$, QueryBuilder, QueryEvents } from '../../../src/Core';
import { FakeResults } from '../../Fake';
import { Simulate } from '../../Simulate';
import { IFacetResponseValue } from '../../../src/rest/Facet/FacetResponse';
import { FacetValueState } from '../../../src/rest/Facet/FacetValueState';
import { ResultListUtils } from '../../../src/utils/ResultListUtils';
import { IDynamicHierarchicalFacetOptions } from '../../../src/ui/DynamicHierarchicalFacet/IDynamicHierarchicalFacet';
import { DynamicFacetManager } from '../../../src/ui/DynamicFacetManager/DynamicFacetManager';

export function DynamicHierarchicalFacetTest() {
  describe('DynamicHierarchicalFacet', () => {
    let test: Mock.IBasicComponentSetup<DynamicHierarchicalFacet>;
    let options: IDynamicHierarchicalFacetOptions;
    let mockFacetValues: IFacetResponseValue[];

    beforeEach(() => {
      options = { field: '@dummy' };
      initializeComponent();
    });

    function initializeComponent() {
      test = DynamicHierarchicalFacetTestUtils.createAdvancedFakeFacet(options);
      mockFacetValues = DynamicHierarchicalFacetTestUtils.createFakeFacetResponseValues(3, 5);

      test.cmp.values.createFromResponse(
        DynamicHierarchicalFacetTestUtils.getCompleteFacetResponse(test.cmp, {
          values: mockFacetValues
        })
      );

      spyOn(test.cmp, 'selectPath').and.callThrough();
      spyOn(test.cmp, 'scrollToTop').and.callThrough();
      spyOn(test.cmp, 'ensureDom').and.callThrough();
      spyOn(test.cmp, 'triggerNewQuery').and.callThrough();
      spyOn(test.cmp, 'triggerNewIsolatedQuery').and.callThrough();
      spyOn(test.cmp, 'reset').and.callThrough();
      spyOn(test.cmp, 'clear').and.callThrough();
      spyOn(test.cmp, 'putStateIntoQueryBuilder').and.callThrough();
      spyOn(test.cmp.logger, 'warn').and.callThrough();
      spyOn(test.cmp.values, 'render').and.callThrough();
      spyOn(test.cmp.values, 'selectPath').and.callThrough();
      spyOn(test.cmp.values, 'clear').and.callThrough();
    }

    function triggerPopulateBreadcrumbs() {
      const args: IPopulateBreadcrumbEventArgs = { breadcrumbs: [] };
      $$(test.env.root).trigger(BreadcrumbEvents.populateBreadcrumb, args);
      return args.breadcrumbs;
    }

    function testQueryStateModelValues(path: string[]) {
      const QueryStateModelValues: string[] = test.env.queryStateModel.attributes[`f:${test.cmp.options.id}`];
      expect(QueryStateModelValues).toEqual(path);
    }

    function validateExpandCollapse(shouldBeCollapsed: boolean) {
      expect($$(test.cmp.element).hasClass('coveo-dynamic-hierarchical-facet-collapsed')).toBe(shouldBeCollapsed);
      // TODO: test if search feature is displayed
    }

    function fakeResultsWithFacets() {
      const fakeResultsWithFacets = FakeResults.createFakeResults();
      fakeResultsWithFacets.facets = [
        DynamicHierarchicalFacetTestUtils.getCompleteFacetResponse(test.cmp, {
          values: mockFacetValues
        })
      ];
      return fakeResultsWithFacets;
    }

    function getFirstFacetRequest() {
      return Simulate.query(test.env).queryBuilder.build().facets[0];
    }

    it('fieldName should return the field without @', () => {
      expect(test.cmp.fieldName).toBe('dummy');
    });

    it('facetType should be hierarchical', () => {
      expect(test.cmp.facetType).toBe(FacetType.hierarchical);
    });

    it('facet position should be null by default', () => {
      expect(test.cmp.position).toBeNull();
    });

    it(`when getting successful results
      facet position should be correct`, () => {
      test.cmp.ensureDom();

      Simulate.query(test.env, { results: fakeResultsWithFacets() });
      expect(test.cmp.position).toBe(1);
    });

    it('should populate breadcrumbs by default', () => {
      test.cmp.selectPath(['foo']);
      const breadcrumbs = triggerPopulateBreadcrumbs();

      expect(breadcrumbs.length).toBe(1);
    });

    it('should not populate breadcrumbs if the option includeInBreadcrumb is set to "false"', () => {
      options.includeInBreadcrumb = false;
      initializeComponent();

      test.cmp.selectPath(['foo']);
      const breadcrumbs = triggerPopulateBreadcrumbs();

      expect(breadcrumbs.length).toBe(0);
    });

    it(`when updating the QueryStateModel
    should change the values correctly`, () => {
      test.env.queryStateModel.registerNewAttribute(`f:${test.cmp.options.id}`, []);
      test.env.queryStateModel.set(`f:${test.cmp.options.id}`, ['a', 'b', 'c']);
      testQueryStateModelValues(['a', 'b', 'c']);
    });

    it(`when a previously idle value is returned selected by the API (autoselection)
    should update the QueryStateModel correctly`, () => {
      mockFacetValues[0].children = [];
      mockFacetValues[0].state = FacetValueState.selected;
      const results = fakeResultsWithFacets();
      Simulate.query(test.env, { results });

      testQueryStateModelValues([results.facets[0].values[0].value]);
    });

    it('should call selectPath and log an analytics event when selecting a path through the QueryStateModel', () => {
      test.env.queryStateModel.registerNewAttribute(`f:${test.cmp.options.id}`, []);
      test.env.queryStateModel.set(`f:${test.cmp.options.id}`, ['a', 'b', 'c']);

      expect(test.cmp.selectPath).toHaveBeenCalledWith(['a', 'b', 'c']);
      // TODO: JSUI-2709 add analytics
    });

    it('should call clear and log an analytics event when clearing the path through the QueryStateModel', () => {
      test.env.queryStateModel.registerNewAttribute(`f:${test.cmp.options.id}`, ['allo']);
      test.env.queryStateModel.set(`f:${test.cmp.options.id}`, []);

      expect(test.cmp.clear).toHaveBeenCalled();
      // TODO: JSUI-2709 add analytics
    });

    describe('testing collapse/expand', () => {
      it(`when enableCollapse & collapsedByDefault options are true
        facet should be collapsed`, () => {
        options.enableCollapse = true;
        options.collapsedByDefault = true;
        initializeComponent();
        test.cmp.ensureDom();

        validateExpandCollapse(true);
      });

      it(`when enableCollapse is false & collapsedByDefault options is true
        facet should not be collapsed`, () => {
        options.enableCollapse = false;
        options.collapsedByDefault = true;
        initializeComponent();
        test.cmp.ensureDom();

        validateExpandCollapse(false);
      });

      it(`allows to collapse when enableCollapse is true`, () => {
        test.cmp.ensureDom();
        test.cmp.collapse();

        validateExpandCollapse(true);
      });

      it(`allows to expand when enableCollapse is true`, () => {
        test.cmp.ensureDom();
        test.cmp.collapse();

        test.cmp.expand();

        validateExpandCollapse(false);
      });

      it(`does not allow to expand if the enableCollapse is false`, () => {
        options.enableCollapse = false;
        initializeComponent();
        test.cmp.ensureDom();
        test.cmp.collapse();
        expect(test.cmp.logger.warn).toHaveBeenCalled();
      });

      it(`does not allow to collapse if the enableCollapse is false`, () => {
        options.enableCollapse = false;
        initializeComponent();
        test.cmp.ensureDom();
        test.cmp.expand();
        expect(test.cmp.logger.warn).toHaveBeenCalled();
      });

      it(`allows to toggle between expand/collapse`, () => {
        test.cmp.ensureDom();

        test.cmp.toggleCollapse();
        validateExpandCollapse(true);

        test.cmp.toggleCollapse();
        validateExpandCollapse(false);
      });
    });

    it('calling "scrollToTop" should call "scrollToTop" on the ResultListUtils', () => {
      spyOn(ResultListUtils, 'scrollToTop');
      test.cmp.scrollToTop();

      expect(ResultListUtils.scrollToTop).toHaveBeenCalledWith(test.cmp.root);
    });

    it(`when the enableScrollToTop option is "false"
    calling "scrollToTop" should not call "scrollToTop" on the ResultListUtils`, () => {
      options.enableScrollToTop = false;
      initializeComponent();
      spyOn(ResultListUtils, 'scrollToTop');
      test.cmp.scrollToTop();

      expect(ResultListUtils.scrollToTop).not.toHaveBeenCalledWith(test.cmp.root);
    });

    it('allows to trigger a new query', () => {
      test.cmp.ensureDom();
      test.cmp.triggerNewQuery();

      expect(test.cmp.queryController.executeQuery).toHaveBeenCalled();
    });

    it('allows to trigger a new isolated query', () => {
      spyOn(test.cmp.dynamicHierarchicalFacetQueryController, 'getQueryResults');
      const beforeExecuteQuery = jasmine.createSpy('beforeExecuteQuery', () => {});
      test.cmp.ensureDom();
      test.cmp.triggerNewIsolatedQuery(beforeExecuteQuery);

      expect(test.cmp.dynamicHierarchicalFacetQueryController.getQueryResults).toHaveBeenCalled();
      expect(beforeExecuteQuery).toHaveBeenCalled();
    });

    it('triggering a new isolated query updates the values', () => {
      test.cmp.ensureDom();
      test.cmp.triggerNewIsolatedQuery();

      expect(test.cmp.values.render).toHaveBeenCalled();
    });

    describe('testing showMore/showLess', () => {
      it('showMore adds by the numberOfValues option by default', () => {
        const additionalNumberOfValues = test.cmp.options.numberOfValues;
        test.cmp.showMore();

        expect(getFirstFacetRequest().numberOfValues).toBe(test.cmp.options.numberOfValues + additionalNumberOfValues);
      });

      it('allows to showMore with a custom amount of values', () => {
        const additionalNumberOfValues = 38;
        test.cmp.showMore(additionalNumberOfValues);
        expect(test.cmp.triggerNewIsolatedQuery).toHaveBeenCalled();

        expect(getFirstFacetRequest().numberOfValues).toBe(test.cmp.options.numberOfValues + additionalNumberOfValues);
      });

      it('showMore triggers a query', () => {
        test.cmp.showMore();
        expect(test.cmp.triggerNewIsolatedQuery).toHaveBeenCalled();
      });

      it('showLess resets the amount of values to the numberOfValues option', () => {
        const additionalNumberOfValues = 38;
        test.cmp.showMore(additionalNumberOfValues);
        test.cmp.showLess();

        expect(getFirstFacetRequest().numberOfValues).toBe(test.cmp.options.numberOfValues);
      });

      it('showLess triggers a query', () => {
        test.cmp.showLess();
        expect(test.cmp.triggerNewIsolatedQuery).toHaveBeenCalled();
      });
    });

    it('calling enableFreezeFacetOrderFlag should call it in the dynamicHierarchicalFacetQueryController', () => {
      spyOn(test.cmp.dynamicHierarchicalFacetQueryController, 'enableFreezeFacetOrderFlag').and.callThrough();
      test.cmp.enableFreezeFacetOrderFlag();
      expect(test.cmp.dynamicHierarchicalFacetQueryController.enableFreezeFacetOrderFlag).toHaveBeenCalled();
    });

    describe('when calling reset', () => {
      beforeEach(() => {
        test.cmp.reset();
      });

      it('should call clear', () => {
        expect(test.cmp.clear).toHaveBeenCalled();
      });

      it('should call scrollToTop', () => {
        expect(test.cmp.scrollToTop).toHaveBeenCalled();
      });

      it('should trigger a new query', () => {
        expect(test.cmp.triggerNewQuery).toHaveBeenCalled();
      });

      // TODO: JSUI-2709 add analytics
    });

    describe('when calling clear', () => {
      beforeEach(() => {
        test.cmp.values.selectPath(['hey']);
        test.cmp.clear();
      });

      it('should call clear on the values', () => {
        expect(test.cmp.values.clear).toHaveBeenCalled();
      });

      it('should update queryStateModel with an empty array', () => {
        testQueryStateModelValues([]);
      });
    });

    describe('when calling selectPath', () => {
      const path = ['new', 'original', 'path'];
      beforeEach(() => {
        test.cmp.selectPath(path);
      });

      it('should call ensureDom', () => {
        expect(test.cmp.ensureDom).toHaveBeenCalled();
      });

      it('should update queryStateModel with the path', () => {
        testQueryStateModelValues(path);
      });

      it('should call selectPath on the values', () => {
        expect(test.cmp.values.selectPath).toHaveBeenCalledWith(path);
      });
    });

    it('getCaption should return the caption for a value', () => {
      options.valueCaption = { test: 'this is a test' };
      initializeComponent();
      expect(test.cmp.getCaption('test')).toBe('this is a test');
    });

    describe('Testing the header', () => {
      beforeEach(() => {
        test.cmp.selectPath([mockFacetValues[0].value]);
        test.cmp.ensureDom();
        spyOn(test.cmp.header, 'showLoading').and.callThrough();
        spyOn(test.cmp.header, 'hideLoading').and.callThrough();
        spyOn(test.cmp.header, 'toggleCollapse').and.callThrough();
      });

      it(`when triggering the header "clear" method
      should perform the correct action on the facet`, () => {
        test.cmp.header.options.clear();
        expect(test.cmp.reset).toHaveBeenCalledTimes(1);
      });

      it(`when triggering a query
      should call "showLoading" on the header`, () => {
        test.cmp.triggerNewQuery();
        expect(test.cmp.header.showLoading).toHaveBeenCalledTimes(1);
      });

      it(`when a query is successful
      should call "hideLoading" on the header`, () => {
        Simulate.query(test.env, { results: fakeResultsWithFacets() });
        expect(test.cmp.header.hideLoading).toHaveBeenCalledTimes(1);
      });

      it('should call "toggleCollapse" when calling collapse', () => {
        test.cmp.collapse();
        expect(test.cmp.header.toggleCollapse).toHaveBeenCalled();
      });
    });

    describe('testing the DependsOnManager', () => {
      beforeEach(() => {
        spyOn(test.cmp.dependsOnManager, 'updateVisibilityBasedOnDependsOn');
      });

      it('should initialize the dependsOnManager', () => {
        expect(test.cmp.dependsOnManager).toBeTruthy();
      });

      it(`when facet appearance is updated (e.g. after a successful query)
      should call the "updateVisibilityBasedOnDependsOn" method of the DependsOnManager`, () => {
        Simulate.query(test.env, { results: fakeResultsWithFacets() });
        expect(test.cmp.dependsOnManager.updateVisibilityBasedOnDependsOn).toHaveBeenCalled();
      });
    });

    it(`when calling putStateIntoQueryBuilder
    should call putStateIntoQueryBuilder on the dynamicHierarchicalFacetQueryController`, () => {
      spyOn(test.cmp.dynamicHierarchicalFacetQueryController, 'putFacetIntoQueryBuilder');
      const queryBuilder = new QueryBuilder();
      test.cmp.putStateIntoQueryBuilder(queryBuilder);
      expect(test.cmp.dynamicHierarchicalFacetQueryController.putFacetIntoQueryBuilder).toHaveBeenCalledWith(queryBuilder);
    });

    describe('testing putStateIntoQueryBuilder', () => {
      it(`when calling putStateIntoQueryBuilder
      should call putFacetIntoQueryBuilder on the dynamicHierarchicalFacetQueryController`, () => {
        spyOn(test.cmp.dynamicHierarchicalFacetQueryController, 'putFacetIntoQueryBuilder');
        const queryBuilder = new QueryBuilder();
        test.cmp.putStateIntoQueryBuilder(queryBuilder);
        expect(test.cmp.dynamicHierarchicalFacetQueryController.putFacetIntoQueryBuilder).toHaveBeenCalledWith(queryBuilder);
      });

      it(`when triggering doneBuildingQuery
      should call putStateIntoQueryBuilder on the facet`, () => {
        const queryBuilder = new QueryBuilder();
        $$(test.cmp.root).trigger(QueryEvents.doneBuildingQuery, { queryBuilder });
        expect(test.cmp.putStateIntoQueryBuilder).toHaveBeenCalledWith(queryBuilder);
      });

      it(`when facet as a dynamicFacetManager
      when triggering doneBuildingQuery
      should not call putStateIntoQueryBuilder on the facet`, () => {
        test.cmp.dynamicFacetManager = Mock.mockComponent(DynamicFacetManager);
        $$(test.cmp.root).trigger(QueryEvents.doneBuildingQuery, { queryBuilder: new QueryBuilder() });
        expect(test.cmp.putStateIntoQueryBuilder).not.toHaveBeenCalled();
      });
    });

    // TODO: JSUI-2709 test logAnalyticsEvent
  });
}
