import { CategoryFacet, ICategoryFacetOptions } from '../../../src/ui/CategoryFacet/CategoryFacet';
import * as Mock from '../../MockEnvironment';
import { $$ } from '../../../src/utils/Dom';
import { IBasicComponentSetup, mock } from '../../MockEnvironment';
import { Simulate, ISimulateQueryData } from '../../Simulate';
import { FakeResults } from '../../Fake';
import { QueryBuilder } from '../../../src/Core';
import { CategoryFacetQueryController } from '../../../src/controllers/CategoryFacetQueryController';
import { IBuildingQueryEventArgs } from '../../../src/events/QueryEvents';
import { first, range, pluck, shuffle } from 'underscore';
import { analyticsActionCauseList } from '../../../src/ui/Analytics/AnalyticsActionListMeta';

export function CategoryFacetTest() {
  function buildSimulateQueryData(numberOfResults = 11, numberOfRequestedValues = 11): ISimulateQueryData {
    const fakeResults = FakeResults.createFakeResults();
    const queryBuilder = new QueryBuilder();
    fakeResults.categoryFacets.push(FakeResults.createFakeCategoryFacetResult('@field', [], 'value', numberOfResults));
    queryBuilder.categoryFacets.push({
      field: '@field',
      path: pluck(fakeResults.categoryFacets[0].parentValues, 'value'),
      maximumNumberOfValues: numberOfRequestedValues
    });
    return { results: fakeResults, query: queryBuilder.build() };
  }

  describe('CategoryFacet', () => {
    let test: IBasicComponentSetup<CategoryFacet>;
    let simulateQueryData: ISimulateQueryData;

    beforeEach(() => {
      simulateQueryData = buildSimulateQueryData();
      test = Mock.advancedComponentSetup<CategoryFacet>(
        CategoryFacet,
        new Mock.AdvancedComponentSetupOptions(null, { field: '@field' }, env => env.withLiveQueryStateModel())
      );
      test.cmp.activePath = simulateQueryData.query.categoryFacets[0].path;
    });

    it('when calling getVisibleParentValues returns all the visible parent values', () => {
      Simulate.query(test.env, simulateQueryData);
      const visibleParentValues: string[] = pluck(test.cmp.getVisibleParentValues(), 'value');
      for (let i = 0; i < test.cmp.activePath.length; i++) {
        expect(visibleParentValues[i]).toEqual(`parent${i}`);
      }
    });

    it('when calling getVisibleParentValues when there are no parents returns empty array', () => {
      simulateQueryData.results.categoryFacets[0].parentValues = [];
      simulateQueryData.query.categoryFacets[0].path = [];
      test.cmp.activePath = [];

      const visibleParentValues = test.cmp.getVisibleParentValues();

      expect(visibleParentValues).toEqual([]);
    });

    it('when calling getAvailableValues returns children of the last parent', () => {
      Simulate.query(test.env, simulateQueryData);
      const values: string[] = pluck(test.cmp.getAvailableValues(), 'value');
      for (let i = 0; i < simulateQueryData.results.categoryFacets[0].values.length - 1; i++) {
        expect(values[i]).toEqual(`value${i}`);
      }
    });

    it('when calling deselectCurrentValue it strips the last element of the path', () => {
      test.cmp.activePath = ['value1', 'value2'];
      test.cmp.deselectCurrentValue();
      expect(test.cmp.activePath).toEqual(['value1']);
    });

    it('when calling deselectCurrentValue and the path is empty the path remains empty', () => {
      test.cmp.activePath = [];
      test.cmp.deselectCurrentValue();
      expect(test.cmp.activePath).toEqual([]);
    });

    it('when calling selectValue with a non-existent value throws an error', () => {
      Simulate.query(test.env, simulateQueryData);
      expect(() => test.cmp.selectValue('inexistentvalue')).toThrowError();
    });

    it('when calling selectValue appends the given value to the path', () => {
      const currentPath = test.cmp.activePath;
      Simulate.query(test.env, simulateQueryData);

      test.cmp.selectValue('value9');

      expect(test.cmp.activePath).toEqual(currentPath.concat(['value9']));
    });

    it('calling hide adds the coveo hidden class', () => {
      test.cmp.hide();
      expect($$(test.cmp.element).hasClass('coveo-hidden')).toBeTruthy();
    });

    it('hides the component when there is no results', () => {
      const emptyCategoryFacetResults = FakeResults.createFakeCategoryFacetResult('@field', [], undefined, 0);
      simulateQueryData.results = { ...simulateQueryData.results, categoryFacets: [emptyCategoryFacetResults] };
      spyOn(test.cmp, 'hide');

      Simulate.query(test.env, simulateQueryData);

      expect(test.cmp.hide).toHaveBeenCalled();
    });

    describe('when categoryFacet is not implemented on the endpoint', () => {
      beforeEach(() => {
        const categoryFacetResults = FakeResults.createFakeCategoryFacetResult('@field', []);
        const fakeResults = FakeResults.createFakeResults();
        simulateQueryData = {
          ...simulateQueryData,
          results: { ...fakeResults, categoryFacets: [{ ...categoryFacetResults, notImplemented: true }] }
        };
      });

      it('disables the component', () => {
        Simulate.query(test.env, simulateQueryData);

        expect(test.cmp.disabled).toBe(true);
      });

      it('hides the component', () => {
        spyOn(test.cmp, 'hide');
        Simulate.query(test.env, simulateQueryData);
        expect(test.cmp.hide).toHaveBeenCalled();
      });
    });

    describe('calling changeActivePath', () => {
      let newPath: string[];
      beforeEach(() => {
        newPath = ['new', 'path'];
        spyOn(test.cmp.queryStateModel, 'set').and.callThrough();
        test.cmp.changeActivePath(newPath);
      });

      it('sets the new path', () => {
        expect(test.cmp.activePath).toEqual(['new', 'path']);
      });

      it('does not trigger a new query', () => {
        expect(test.cmp.queryController.executeQuery).not.toHaveBeenCalled();
      });

      it('sets the path in the query state', () => {
        expect(test.cmp.queryStateModel.set).toHaveBeenCalledWith(test.cmp.queryStateAttribute, newPath);
      });

      it('shows a wait animation', () => {
        test.cmp.executeQuery();
        const waitIcon = $$(test.cmp.element).find('.' + CategoryFacet.WAIT_ELEMENT_CLASS);
        expect(waitIcon.style.visibility).toEqual('visible');
      });
    });

    it('calling reload calls changeActivePath', () => {
      spyOn(test.cmp, 'changeActivePath');
      test.cmp.reload();
      expect(test.cmp.changeActivePath).toHaveBeenCalledWith(test.cmp.activePath);
    });

    describe('when moreLess is enabled', () => {
      beforeEach(() => {
        test = Mock.optionsComponentSetup<CategoryFacet, ICategoryFacetOptions>(CategoryFacet, {
          field: '@field',
          enableMoreLess: true,
          numberOfValues: 10
        });
      });

      it('more arrow is appended when there are more results to fetch', () => {
        Simulate.query(test.env, simulateQueryData);
        const moreArrow = $$(test.cmp.element).find('.coveo-category-facet-more');
        expect(moreArrow).not.toBeNull();
      });

      it('less arrow is appended when there are more results than the numberOfValues option', () => {
        const numberOfValues = test.cmp.options.numberOfValues + 2; // +1 for the fetchMoreValues and +1 to trigger the less values
        Simulate.query(test.env, buildSimulateQueryData(numberOfValues, numberOfValues));

        const downArrow = $$(test.cmp.element).find('.coveo-category-facet-less');
        expect(downArrow).not.toBeNull();
      });

      it('should not render the downward arrow when there are less values than the numberOfValues option', () => {
        test.cmp.changeActivePath(['path']);
        Simulate.query(test.env, buildSimulateQueryData(3));

        const downArrow = $$(test.cmp.element).find('.coveo-category-facet-less');
        expect(downArrow).toBeNull();
      });

      it('showMore should increment the number of values requested according the the pageSize', () => {
        const initialNumberOfValues = test.cmp.options.numberOfValues;
        const pageSize = test.cmp.options.pageSize;
        Simulate.query(test.env, simulateQueryData);

        test.cmp.showMore();
        const { queryBuilder } = Simulate.query(test.env, simulateQueryData);

        expect(queryBuilder.categoryFacets[0].maximumNumberOfValues).toBe(initialNumberOfValues + pageSize + 1);
      });

      it('showLess should decrement the number of values requested according to the pageSize', () => {
        const pageSize = test.cmp.options.pageSize;
        const initialNumberOfValues = 20;
        test.cmp.showMore();
        simulateQueryData = buildSimulateQueryData(21, 21);
        Simulate.query(test.env, simulateQueryData);

        test.cmp.showLess();
        const { queryBuilder } = Simulate.query(test.env, simulateQueryData);

        expect(queryBuilder.categoryFacets[0].maximumNumberOfValues).toBe(initialNumberOfValues - pageSize + 1);
      });

      it('showLess should not request less values than the numberOfValues option', () => {
        const initialNumberOfValues = test.cmp.options.numberOfValues;
        simulateQueryData = buildSimulateQueryData(13, 13);
        Simulate.query(test.env, simulateQueryData);

        test.cmp.showLess();
        const { queryBuilder } = Simulate.query(test.env, simulateQueryData);

        expect(queryBuilder.categoryFacets[0].maximumNumberOfValues).toBe(initialNumberOfValues + 1);
      });
    });

    it('calls putCategoryFacetInQueryBuilder when building the query', () => {
      const queryBuilder = mock(QueryBuilder);
      const buildingQueryArgs = { queryBuilder } as IBuildingQueryEventArgs;
      test.cmp.categoryFacetQueryController = mock(CategoryFacetQueryController);
      const path = (test.cmp.activePath = ['some', 'path']);

      test.cmp.handleBuildingQuery(buildingQueryArgs);

      expect(test.cmp.categoryFacetQueryController.putCategoryFacetInQueryBuilder).toHaveBeenCalledWith(
        queryBuilder,
        path,
        test.cmp.options.numberOfValues + 1
      );
    });

    describe('renders', () => {
      function removeAllCategoriesButton(element) {
        const allCategoriesButton = $$(element).find('.coveo-category-facet-all-categories');
        allCategoriesButton && $$(allCategoriesButton).detach();
      }

      function verifyParents(numberOfParents: number) {
        removeAllCategoriesButton(test.cmp.element);
        const parentCategoryValues = $$(test.cmp.element).findAll('.coveo-category-facet-parent-value');
        for (const i of range(numberOfParents)) {
          const valueCaption = $$(parentCategoryValues[i]).find('.coveo-category-facet-value-caption');
          const valueCount = $$(parentCategoryValues[i]).find('.coveo-category-facet-value-count');
          expect($$(valueCaption).text()).toEqual(`parent${i}`);
          expect($$(valueCount).text()).toEqual('5');
        }
      }

      function verifyChildren(numberOfValues: number) {
        removeAllCategoriesButton(test.cmp.element);
        const categoryValues = $$(test.cmp.element).findAll('.coveo-category-facet-child-value');
        for (const i of range(0, numberOfValues)) {
          const valueCaption = $$(categoryValues[i]).find('.coveo-category-facet-value-caption');
          const valueCount = $$(categoryValues[i]).find('.coveo-category-facet-value-count');
          expect($$(valueCaption).text()).toEqual(`value${i}`);
          expect($$(valueCount).text()).toEqual('5');
        }
      }

      beforeEach(() => {
        Object.defineProperty(test.cmp, 'activePath', {
          get: () => simulateQueryData.query.categoryFacets[0].path
        });
      });

      it('when there are only children', () => {
        const numberOfValues = simulateQueryData.results.categoryFacets[0].values.length - 1; //-1 because we always request one more result
        simulateQueryData.query.categoryFacets[0].path = [];
        simulateQueryData.results.categoryFacets[0].parentValues = [];
        Simulate.query(test.env, simulateQueryData);

        verifyChildren(numberOfValues);
      });

      it('when there are only parents', () => {
        const numberOfParents = simulateQueryData.results.categoryFacets[0].parentValues.length - 1;
        simulateQueryData.results.categoryFacets[0].values = [];
        Simulate.query(test.env, simulateQueryData);

        verifyParents(numberOfParents);
      });

      it('when there are children and parents', () => {
        const numberOfValues = simulateQueryData.results.categoryFacets[0].values.length - 1;
        Simulate.query(test.env, simulateQueryData);
        verifyChildren(numberOfValues);
      });

      it('correctly sorts parents', () => {
        const numberOfParents = simulateQueryData.results.categoryFacets[0].parentValues.length - 1;
        simulateQueryData.results.categoryFacets[0].values = [];
        simulateQueryData.results.categoryFacets[0].parentValues = shuffle(simulateQueryData.results.categoryFacets[0].parentValues);

        Simulate.query(test.env, simulateQueryData);

        verifyParents(numberOfParents);
      });

      it('correct number of children when there are less results than what has been queried for', () => {
        // We usually render one less result than what we queried for, because the extra result queried is just a check.
        // This makes sure we don't do it when there are less results than we queries for.
        const numberOfRequestedValues = test.cmp.options.numberOfValues - 1;
        const numberOfReturnedValues = numberOfRequestedValues - 1;
        simulateQueryData = buildSimulateQueryData(numberOfReturnedValues, numberOfRequestedValues);
        simulateQueryData.results.categoryFacets[0].parentValues = [];

        Simulate.query(test.env, simulateQueryData);

        removeAllCategoriesButton(test.cmp.element);
        expect($$(test.cmp.element).findAll('.coveo-category-facet-value').length).toEqual(numberOfReturnedValues);
      });

      it('appends an all categories button when there are parents', () => {
        Simulate.query(test.env, simulateQueryData);
        expect($$(test.cmp.element).find('.coveo-category-facet-all-categories')).not.toBeNull();
      });

      it('does not append an all categories button when there are no parents', () => {
        simulateQueryData.query.categoryFacets[0].path = [];
        Simulate.query(test.env, simulateQueryData);
        expect($$(test.cmp.element).find('.coveo-category-facet-all-categories')).toBeNull();
      });
    });

    it('when default path is specified, sends the correct path in the query', () => {
      test = Mock.optionsComponentSetup<CategoryFacet, ICategoryFacetOptions>(CategoryFacet, {
        field: '@field',
        basePath: ['base', 'path']
      });
      const { queryBuilder } = Simulate.query(test.env, simulateQueryData);
      expect(first(queryBuilder.categoryFacets[0].path, 2)).toEqual(['base', 'path']);
    });

    it('when default path is specified, exclude those values from the rendered values', () => {
      test = Mock.optionsComponentSetup<CategoryFacet, ICategoryFacetOptions>(CategoryFacet, {
        field: '@field',
        basePath: ['parent0', 'parent1']
      });
      Simulate.query(test.env, simulateQueryData);

      const values = $$(test.cmp.element)
        .findAll('.coveo-category-facet-value-caption')
        .map(el => $$(el).text());
      expect(values).not.toContain('parent0');
      expect(values).not.toContain('parent1');
    });

    describe('when populating the breadcrumb', () => {
      const populateBreadcrumb = () => {
        Simulate.query(test.env, simulateQueryData);
        test.cmp.selectValue('value0');
        return Simulate.breadcrumb(test.env);
      };

      const getClearElement = () => {
        return $$(populateBreadcrumb()[0].element).find('.coveo-facet-breadcrumb-clear');
      };

      it('should populate the correct title', () => {
        test.cmp.options.title = 'My Category Facet';
        expect(populateBreadcrumb()[0].element.textContent).toContain('My Category Facet');
      });

      it('should populate the correct breadcrumb value', () => {
        expect(populateBreadcrumb()[0].element.textContent).toContain('parent0/parent1/parent2');
        expect(populateBreadcrumb()[0].element.textContent).toContain('/value0');
      });

      it('should clear the facet when the clear button is clicked', () => {
        $$(getClearElement()).trigger('click');
        expect(test.cmp.activePath).toEqual([]);
      });

      it('should log an analytics event when the clear button is clicked', () => {
        $$(getClearElement()).trigger('click');
        expect(test.env.usageAnalytics.logSearchEvent).toHaveBeenCalledWith(
          analyticsActionCauseList.breadcrumbFacet,
          jasmine.objectContaining({
            categoryFacetId: test.cmp.options.id,
            categoryFacetField: test.cmp.options.field,
            categoryFacetPath: jasmine.arrayContaining(['value0']),
            categoryFacetTitle: test.cmp.options.title
          })
        );
      });

      it('should clear the facet when the clearBreadcrumb event is triggered', () => {
        populateBreadcrumb();
        expect(test.cmp.activePath).not.toEqual([]);
        Simulate.clearBreadcrumb(test.env);
        expect(test.cmp.activePath).toEqual([]);
      });

      it('should not trigger a query when clearBreadcrumb event is triggered', () => {
        populateBreadcrumb();
        // Reset since it's called once inside "populateBreadcrumb()"
        (test.env.queryController.executeQuery as jasmine.Spy).calls.reset();

        Simulate.clearBreadcrumb(test.env);
        expect(test.env.queryController.executeQuery).not.toHaveBeenCalled();
      });
    });

    describe("when there's many parent values to display", () => {
      beforeEach(() => {
        simulateQueryData = buildSimulateQueryData(30, 30);
        Simulate.query(test.env, simulateQueryData);
      });

      it('should only return the non-ellipsed values as visible', () => {
        const visibles = test.cmp.getVisibleParentValues();

        // NUMBER_OF_VALUES_TO_KEEP_AFTER_TRUNCATING parents + 1 child value
        expect(visibles.length).toBe(CategoryFacet.NUMBER_OF_VALUES_TO_KEEP_AFTER_TRUNCATING + 1);
      });

      it('should properly build the ellipse boundaries', () => {
        const visibles = test.cmp.getVisibleParentValues();

        // Check first value
        expect(visibles[0].value).toContain('parent0');

        // Check value right before ellipse
        expect(visibles[CategoryFacet.NUMBER_OF_VALUES_TO_KEEP_AFTER_TRUNCATING / 2 - 1].value).toContain('parent4');

        // Check value right after ellipse
        expect(visibles[CategoryFacet.NUMBER_OF_VALUES_TO_KEEP_AFTER_TRUNCATING / 2].value).toContain('parent25');

        // Check last parent value
        expect(visibles[visibles.length - 2].value).toBe('parent29');

        // Check last child value
        expect(visibles[visibles.length - 1].value).toBe('value0');
      });

      it('should properly render an ellipse section', () => {
        const ellipsis = $$(test.cmp.element).find('.coveo-category-facet-ellipsis');
        expect(ellipsis).toBeDefined();
        expect(ellipsis.previousSibling.textContent).toContain('parent4');
        expect(ellipsis.nextSibling.textContent).toContain('parent25');
      });
    });
  });
}
