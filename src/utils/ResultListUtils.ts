import { Component } from '../ui/Base/Component';
import { ResultList } from '../ui/ResultList/ResultList';
import { $$ } from './Dom';
import { find } from 'underscore';
import { Logger } from '../misc/Logger';

export class ResultListUtils {
  public static hideIfInfiniteScrollEnabled(cmp: Component) {
    const infiniteScrollEnabled = ResultListUtils.isInfiniteScrollEnabled(cmp.searchInterface.element);

    if (infiniteScrollEnabled) {
      cmp.disable();
      $$(cmp.element).hide();
      ResultListUtils.warnIfComponentNotNeeded(cmp);
    } else {
      cmp.enable();
      $$(cmp.element).unhide();
    }
  }

  public static isInfiniteScrollEnabled(root: HTMLElement) {
    const resultList = ResultListUtils.getActiveResultList(root);
    return resultList ? !!resultList.options.enableInfiniteScroll : false;
  }

  public static scrollToTop(root: HTMLElement) {
    const resultList = ResultListUtils.getActiveResultList(root);
    if (!resultList) {
      new Logger(this).warn('No active ResultList, scrolling to the top of the Window');
      return window.scrollTo(0, 0);
    }

    const searchInterfacePosition = resultList.searchInterface.element.getBoundingClientRect().top;
    if (searchInterfacePosition > 0) {
      return;
    }

    window.scrollTo(0, window.pageYOffset + searchInterfacePosition);
  }

  private static getActiveResultList(root: HTMLElement) {
    const resultLists = ResultListUtils.getResultLists(root);
    return find(resultLists, resultList => !resultList.disabled);
  }

  private static getResultLists(root: HTMLElement) {
    return $$(root)
      .findAll(`.${ResultListUtils.cssClass()}`)
      .map(el => <ResultList>Component.get(el, ResultList));
  }

  private static cssClass() {
    return Component.computeCssClassName(ResultList);
  }

  private static warnIfComponentNotNeeded(cmp: Component) {
    const root = cmp.searchInterface.root;
    const allListsUseInfiniteScroll = ResultListUtils.allResultListsUseInfiniteScroll(root);

    allListsUseInfiniteScroll && ResultListUtils.notNeededComponentWarning(cmp);
  }

  private static allResultListsUseInfiniteScroll(root: HTMLElement) {
    const listsWithInfiniteScrollDisabled = ResultListUtils.getResultLists(root).filter(
      resultList => !resultList.options.enableInfiniteScroll
    );

    return listsWithInfiniteScrollDisabled.length === 0;
  }

  private static notNeededComponentWarning(cmp: Component) {
    const cmpCssClass = Component.computeCssClassNameForType(cmp.type);
    const message = `The ${cmpCssClass} component is not needed because all ${ResultListUtils.cssClass()} components have enableInfiniteScroll set to 'true'.
    For the best performance, remove the ${cmpCssClass} component from your search page.`;

    new Logger(cmp).warn(message);
  }
}
