import * as Mock from '../MockEnvironment';
import { ResultListUtils } from '../../src/utils/ResultListUtils';
import { IResultListOptions } from '../../src/ui/ResultList/ResultListOptions';
import { ResultList } from '../../src/ui/ResultList/ResultList';
import { Component } from '../../src/Core';
import { SearchInterface } from '../../src/ui/SearchInterface/SearchInterface';

export const ResultListUtilsTest = () => {
  describe('ResultListUtils', () => {
    const utils = ResultListUtils;
    let root: SearchInterface;
    let cmp: Component;
    let resultList: Component;

    function appendResultListToRoot(options: IResultListOptions = {}, disabled = false) {
      resultList = Mock.optionsComponentSetup<ResultList, IResultListOptions>(ResultList, options).cmp;
      resultList.disabled = disabled;
      root.element.appendChild(resultList.element);
    }

    function initSearchInterface() {
      root = Mock.basicComponentSetup<SearchInterface>(SearchInterface).cmp;
    }

    function initComponent() {
      const div = document.createElement('div');
      cmp = new Component(div, 'Pager', { searchInterface: root });
    }

    beforeEach(() => initSearchInterface());

    describe(`when a result list with enableInfiniteScroll set to 'false' is appended to the root,
    when initializing a component`, () => {
      beforeEach(() => {
        appendResultListToRoot({ enableInfiniteScroll: false });
        initComponent();
      });

      it('when calling #hideIfInfiniteScrollEnabled, it calls #enable', () => {
        spyOn(cmp, 'enable');
        utils.hideIfInfiniteScrollEnabled(cmp);
        expect(cmp.enable).toHaveBeenCalledTimes(1);
      });

      it(`when calling #hideIfInfiniteScrollEnabled,
      it sets the css display property to an empty string`, () => {
        utils.hideIfInfiniteScrollEnabled(cmp);
        expect(cmp.element.style.display).toBe('');
      });
    });

    describe(`when a result list with enableInfiniteScroll set to 'true' is appended to the root,
    when initializing a component`, () => {
      beforeEach(() => {
        appendResultListToRoot({ enableInfiniteScroll: true });
        initComponent();
      });

      it('when calling #hideIfInfiniteScrollEnabled, it calls #disable', () => {
        spyOn(cmp, 'disable');
        utils.hideIfInfiniteScrollEnabled(cmp);
        expect(cmp.disable).toHaveBeenCalledTimes(1);
      });

      it(`when calling #hideIfInfiniteScrollEnabled,
      it sets the css display property to 'none'`, () => {
        utils.hideIfInfiniteScrollEnabled(cmp);
        expect(cmp.element.style.display).toBe('none');
      });
    });

    it(`when a result list with enableInfiniteScroll set to 'false' is appended to the root,
    when calling #isInfiniteScrollEnabled,
    it returns 'false'`, () => {
      appendResultListToRoot({ enableInfiniteScroll: false });
      expect(utils.isInfiniteScrollEnabled(root.element)).toBe(false);
    });

    it(`when a result list with enableInfiniteScroll set to 'true' is appended to the root,
    when calling #isInfiniteScrollEnabled,
    it returns 'true'`, () => {
      appendResultListToRoot({ enableInfiniteScroll: true });
      expect(utils.isInfiniteScrollEnabled(root.element)).toBe(true);
    });

    it(`when appending a result list where enableInfiniteScroll is 'true' but is disabled,
    when calling #isInfiniteScrollEnabled,
    it returns 'false'`, () => {
      appendResultListToRoot({ enableInfiniteScroll: true }, true);
      expect(utils.isInfiniteScrollEnabled(root.element)).toBe(false);
    });

    describe(`when calling #scrollToTop`, () => {
      let infiniteScrollContainer: HTMLElement;
      let scrollTopSpy: jasmine.Spy;

      beforeEach(() => {
        infiniteScrollContainer = document.createElement('div');
        spyOn(window, 'scrollTo');
        spyOn(infiniteScrollContainer, 'scrollTo');

        let innerValue = 500;
        scrollTopSpy = jasmine.createSpy('scrollTop', v => (innerValue = v));
        Object.defineProperty(infiniteScrollContainer, 'scrollTop', {
          get: () => innerValue,
          set: scrollTopSpy
        });
      });

      it(`with no active result list
      should scroll to top on the window`, () => {
        appendResultListToRoot({ infiniteScrollContainer }, true);
        utils.scrollToTop(root.element);
        expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
      });

      it(`when the top of the searchInterface is in the view port
      should not scroll`, () => {
        appendResultListToRoot();
        spyOn(resultList.searchInterface.element, 'getBoundingClientRect').and.returnValue({ top: 100 });

        utils.scrollToTop(root.element);
        expect(window.scrollTo).not.toHaveBeenCalled();
      });

      it(`when the top of the searchInterface is above the view port
      it scrolls to the search interface`, () => {
        const top = -100;

        appendResultListToRoot();
        spyOn(resultList.searchInterface.element, 'getBoundingClientRect').and.returnValue({ top });

        utils.scrollToTop(root.element);
        expect(window.scrollTo).toHaveBeenCalledWith(0, top);
      });

      it(`when the top of the searchInterface is above the view port, and is offset from the top of the page,
      it scrolls to the search interface`, () => {
        const yOffset = 1000;
        const top = -100;

        appendResultListToRoot();
        (window as any).pageYOffset = yOffset;
        spyOn(resultList.searchInterface.element, 'getBoundingClientRect').and.returnValue({ top });

        utils.scrollToTop(root.element);
        expect(window.scrollTo).toHaveBeenCalledWith(0, yOffset + top);
      });
    });
  });
};
