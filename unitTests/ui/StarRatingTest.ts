import { l } from '../../src/Core';
import { FakeResults } from '../Fake';
import { $$ } from '../../src/utils/Dom';
import * as Mock from '../MockEnvironment';
import { IQueryResult } from '../../src/rest/QueryResult';
import { StarRating, IStarRatingOptions } from '../../src/ui/StarRating/StarRating';

const CONTAINER_CSS_CLASS = 'CoveoStarRating';
const STAR_CSS_CLASS = 'coveo-star-rating-star';
const ACTIVE_STAR_CSS_CLASS = 'coveo-star-rating-star-active';
const STAR_LABEL_CSS_CLASS = 'coveo-star-rating-label';

const getActiveStars = (starRatingElement: HTMLElement) => {
  return {
    numStars: starRatingElement.querySelectorAll(`.${STAR_CSS_CLASS}`).length,
    numActiveStars: starRatingElement.querySelectorAll(`.${ACTIVE_STAR_CSS_CLASS}`).length
  };
};

export function StarRatingTest() {
  let test: Mock.IBasicComponentSetup<StarRating>;

  function initStarRatingComponent(ratingValue: String, numRatingsValue?: String, ratingScale?: number) {
    const options: IStarRatingOptions = { ratingField: '@rating', numberOfRatingsField: '@numberOfRatings', ratingScale: ratingScale };
    const result: IQueryResult = FakeResults.createFakeResult();

    result.raw.rating = ratingValue;
    result.raw.numberOfRatings = numRatingsValue;

    test = Mock.advancedResultComponentSetup<StarRating>(StarRating, result, <Mock.AdvancedComponentSetupOptions>{
      element: $$('div').el,
      cmpOptions: options,
      modifyBuilder: (builder: Mock.MockEnvironmentBuilder) => {
        return builder;
      }
    });
  }

  describe('When the component is instantiated', () => {
    it('should have correct class type', () => {
      initStarRatingComponent('0', '0');
      expect(test.cmp.element.classList.contains(CONTAINER_CSS_CLASS)).toBe(true);
    });

    describe('The star elements', () => {
      it('should display five stars with a number of active stars equal to rating given', () => {
        for (let i = 0; i <= 5; i++) {
          initStarRatingComponent(i.toString());

          let starData = getActiveStars(test.cmp.element);
          expect(starData.numStars).toBe(5);
          expect(starData.numActiveStars).toBe(i);
        }
      });

      it('should display no active stars when the rating provided is negative', () => {
        const testRating = -Number.MAX_VALUE;
        initStarRatingComponent(testRating.toString());

        const starData = getActiveStars(test.cmp.element);
        expect(starData.numStars).toBe(5);
        expect(starData.numActiveStars).toBe(0);
      });
    });

    describe('The label showing number of ratings', () => {
      it('should not display when no value is provided for number of ratings', () => {
        initStarRatingComponent((0).toString());
        const children = $$(test.cmp.element).findAll(`.${STAR_LABEL_CSS_CLASS}`);
        expect(children.length).toBe(0);
      });

      it('should display a label with "No Ratings" shown when zero given', () => {
        const testNumRatings = 0;
        initStarRatingComponent((0).toString(), testNumRatings.toString());

        const testLabel = $$(test.cmp.element).find(`.${STAR_LABEL_CSS_CLASS}`);
        expect(testLabel).toBeDefined();
        expect(testLabel.textContent).toEqual(l('No Ratings'));
      });

      it('should display a label with "No Ratings" shown when a negative number is given', () => {
        const testNumRatings = -Number.MAX_VALUE;
        initStarRatingComponent((0).toString(), testNumRatings.toString());

        const testLabel = $$(test.cmp.element).find(`.${STAR_LABEL_CSS_CLASS}`);
        expect(testLabel).toBeDefined();
        expect(testLabel.textContent).toEqual(l('No Ratings'));
      });

      it('should display the number when they are provided', () => {
        const testNumRatings = Number.MAX_VALUE;
        initStarRatingComponent((0).toString(), testNumRatings.toString());

        const testLabel = $$(test.cmp.element).find(`.${STAR_LABEL_CSS_CLASS}`);
        expect(testLabel).toBeDefined();
        expect(testLabel.textContent).toEqual(`(${testNumRatings})`);
      });
    });

    describe('When a different scale is provided', () => {
      it('should display five stars with a number of active stars equal to new proportions', () => {
        const newScale = 10;
        for (let i = 0; i <= newScale; i++) {
          initStarRatingComponent(i.toString(), undefined, newScale);

          const starData = getActiveStars(test.cmp.element);
          expect(starData.numStars).toBe(5);
          expect(starData.numActiveStars).toBe(Math.floor(i / 2));
        }
      });

      it('should not display the component if the scale is smaller than the rating', () => {
        const newScale = 7;
        const rating = '10';
        initStarRatingComponent(rating, undefined, newScale);

        expect(test.cmp.element.children.length).toBe(0);
      });

      it('should not display the component if the scale is equal to zero', () => {
        const newScale = 0;
        const rating = '4';
        initStarRatingComponent(rating, undefined, newScale);

        expect(test.cmp.element.children.length).toBe(0);
      });

      it('should not display the component if the scale is smaller than zero', () => {
        const newScale = -Number.MAX_VALUE;
        const rating = '4';
        initStarRatingComponent(rating, undefined, newScale);

        expect(test.cmp.element.children.length).toBe(0);
      });
    });
  });
}
