import { CategoryFacet, ICategoryFacetOptions } from '../../../src/ui/CategoryFacet/CategoryFacet';
import * as Mock from '../../MockEnvironment';
import { $$, Dom } from '../../../src/utils/Dom';
import { IQueryResults } from '../../../src/rest/QueryResults';
import { IBasicComponentSetup, mock } from '../../MockEnvironment';
import { Simulate, ISimulateQueryData } from '../../Simulate';
import { FakeResults } from '../../Fake';
import { QueryBuilder } from '../../../src/Core';
import { CategoryFacetQueryController } from '../../../src/controllers/CategoryFacetQueryController';
import { IBuildingQueryEventArgs } from '../../../src/events/QueryEvents';
import { range, pluck, shuffle } from 'underscore';

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
      test = Mock.optionsComponentSetup<CategoryFacet, ICategoryFacetOptions>(CategoryFacet, {
        field: '@field'
      });
    });

    it('calling hide adds the coveo hidden class', () => {
      test.cmp.hide();
      expect($$(test.cmp.element).hasClass('coveo-hidden')).toBeTruthy();
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

    it('hides the component when there is no results', () => {
      const emptyCategoryFacetResults = FakeResults.createFakeCategoryFacetResult('@field', [], undefined, 0);
      simulateQueryData.results = { ...simulateQueryData.results, categoryFacets: [emptyCategoryFacetResults] };
      spyOn(test.cmp, 'hide');

      Simulate.query(test.env, simulateQueryData);

      expect(test.cmp.hide).toHaveBeenCalled();
    });

    describe('calling changeActivePath', () => {
      let newPath: string[];
      let queryPromise: Promise<IQueryResults>;
      beforeEach(() => {
        newPath = ['new', 'path'];
        queryPromise = test.cmp.changeActivePath(newPath);
      });

      it('sets the new path', () => {
        expect(test.cmp.activePath).toEqual(['new', 'path']);
      });

      it('triggers a new query', () => {
        expect(test.cmp.queryController.executeQuery).toHaveBeenCalled();
      });

      it('sets the path in the query state', () => {
        expect(test.cmp.queryStateModel.set).toHaveBeenCalledWith(test.cmp.queryStateAttribute, newPath);
      });

      it('shows a wait animation', () => {
        const waitIcon = $$(test.cmp.element).find('.' + CategoryFacet.WAIT_ELEMENT_CLASS);
        expect(waitIcon.style.visibility).toEqual('visible');
      });

      it('hides the wait animation after the query', done => {
        queryPromise.then(() => {
          const waitIcon = $$(test.cmp.element).find('.' + CategoryFacet.WAIT_ELEMENT_CLASS);
          expect(waitIcon).not.toBeNull();
          expect(waitIcon.style.visibility).toEqual('hidden');
          done();
        });
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
        const numberOfValues = test.cmp.options.numberOfValues + 1; // +1 for the fetchMoreValues and +1 to trigger the less values
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
        let currentCategoryValue = $$(test.cmp.element).find('.coveo-category-facet-value');
        for (const i of range(numberOfParents)) {
          const valueCaption = $$(currentCategoryValue).find('.coveo-category-facet-value-caption');
          const valueCount = $$(currentCategoryValue).find('.coveo-category-facet-value-count');
          expect($$(valueCaption).text()).toEqual(`parent${i}`);
          expect($$(valueCount).text()).toEqual('5');
          currentCategoryValue = $$(currentCategoryValue).find('.coveo-category-facet-value');
        }
        return $$(currentCategoryValue);
      }

      function verifyChildren(numberOfValues: number, parent: Dom = $$(test.cmp.element)) {
        removeAllCategoriesButton(parent);
        const categoryValues = $$(parent).findAll('.coveo-category-facet-value');
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
        const numberOfParents = simulateQueryData.results.categoryFacets[0].parentValues.length - 1;
        const numberOfValues = simulateQueryData.results.categoryFacets[0].values.length - 1;

        Simulate.query(test.env, simulateQueryData);

        const lastParent = verifyParents(numberOfParents);
        verifyChildren(numberOfValues, lastParent);
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
  });
}
