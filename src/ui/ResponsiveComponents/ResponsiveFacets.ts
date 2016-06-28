import {$$, Dom} from '../../utils/Dom';
import {IResponsiveComponent, ResponsiveComponentsManager} from './ResponsiveComponentsManager';
import {EventsUtils} from '../../utils/EventsUtils';
import {Logger} from '../../misc/Logger';
import '../../../sass/_ResponsiveFacets.scss';
import {l} from '../../strings/Strings';
import {PopupUtils, HorizontalAlignment, VerticalAlignment} from '../../utils/PopupUtils';
import {Facet} from '../Facet/Facet';
import _ = require('underscore');

export class ResponsiveFacets implements IResponsiveComponent {

  private static ACTIVE_FACET_HEADER_Z_INDEX = '20';
  private static FACET_DROPDOWN_MIN_WIDTH: number = 280;
  private static TRANSPARENT_BACKGROUND_OPACITY: string = '0.9';
  private static ROOT_MIN_WIDTH: number = 800;
  private static FACETS_NOT_FOUND: string = 'No element with class coveo-facet-column. Responsive facets cannot be enabled';
  private static logger: Logger;

  public ID: string;
  public coveoRoot: Dom;

  private dropdownContent: Dom;
  private previousSibling: Dom;
  private parent: Dom;
  private dropdownHeader: Dom;
  private dropdownHeaderContainer: Dom;
  private tabSection: Dom;
  private popupBackground: Dom;
  private documentClickListener: EventListener;
  private facets: Array<Facet> = [];

  public static init(root: HTMLElement, ID: string, component) {
    this.logger = new Logger('ResponsiveFacets');
    if (!$$(root).find('.coveo-facet-column')) {
      this.logger.info(this.FACETS_NOT_FOUND);
      return;
    }
    ResponsiveComponentsManager.register(ResponsiveFacets, $$(root), ID, component);
  }

  constructor(root: Dom, ID: string) {
    this.ID = ID;
    this.coveoRoot = root;
    this.tabSection = $$(this.coveoRoot.find('.coveo-tab-section'));
    this.buildDropdownContent();
    this.buildDropdownHeader();
    this.bindDropdownHeaderEvents();
    this.bindDropdownContentEvents();
    this.buildPopupBackground();
    this.saveFacetsPosition();
  }

  public needSmallMode(): boolean {
    return this.coveoRoot.width() <= ResponsiveFacets.ROOT_MIN_WIDTH;
  }

  public changeToSmallMode() {
    this.disableFacetPreservePosition();
    this.tabSection.el.appendChild(this.dropdownHeaderContainer.el);
    this.dropdownContent.detach();
  }

  public changeToLargeMode() {
    this.enableFacetPreservePosition();
    this.dropdownHeaderContainer.detach();
    this.dropdownContent.el.removeAttribute('style');
    this.detachDropdown();
    this.restoreFacetsPosition();
  }

  public registerFacet(facet: Facet) {
    this.facets.push(facet);
  }

  private buildDropdownContent() {
    this.dropdownContent = $$(this.coveoRoot.find('.coveo-facet-column'));
    let filterByContainer = $$('div', { className: 'coveo-facet-header-filter-by-container' });
    let filterBy = $$('div', { className: 'coveo-facet-header-filter-by' });
    filterBy.text(l('Filter by:'));
    filterByContainer.append(filterBy.el)
    this.dropdownContent.prepend(filterByContainer.el);
  }

  private buildDropdownHeader() {
    this.dropdownHeaderContainer = $$('div', { className: 'coveo-facet-dropdown-header-container' });
    this.dropdownHeader = $$('a', { className: 'coveo-dropdown-header coveo-facet-dropdown-header' });
    let content = $$('p');
    content.text(l('facets'));
    this.dropdownHeader.el.appendChild(content.el);
    this.dropdownHeaderContainer.el.appendChild(this.dropdownHeader.el);
  }

  private bindDropdownHeaderEvents() {
    this.dropdownHeader.on('click', () => {
      if (!this.dropdownHeader.hasClass('coveo-dropdown-header-active')) {
        this.positionPopup();
      } else {
        this.detachDropdown();
      }
    });
  }

  private bindDropdownContentEvents() {
    this.documentClickListener = event => {
      let eventTarget = $$(<HTMLElement>event.target);
      if (this.shouldDetachFacetDropdown(eventTarget)) {
        this.detachDropdown();
      }
    };
    $$(document.documentElement).on('click', this.documentClickListener);
  }

  private buildPopupBackground() {
    this.popupBackground = $$('div', { className: 'coveo-facet-dropdown-background' });
    EventsUtils.addPrefixedEvent(this.popupBackground.el, 'TransitionEnd', () => {
      if (this.popupBackground.el.style.opacity == '0') {
        this.popupBackground.detach();
      }
    })
  }

  private shouldDetachFacetDropdown(eventTarget: Dom) {
    return !eventTarget.closest('coveo-facet-column') && !eventTarget.closest('coveo-facet-dropdown-header-container')
      && this.coveoRoot.hasClass('coveo-small-search-interface') && !eventTarget.closest('coveo-facet-settings-popup');
  }

  private saveFacetsPosition() {
    this.previousSibling = this.dropdownContent.el.previousSibling ? $$(<HTMLElement>this.dropdownContent.el.previousSibling) : null;
    this.parent = $$(this.dropdownContent.el.parentElement);
  }

  private restoreFacetsPosition() {
    if (this.previousSibling) {
      this.dropdownContent.insertAfter(this.previousSibling.el);
    } else {
      this.parent.prepend(this.dropdownContent.el);
    }
  }

  private positionPopup() {
    let facetList = this.dropdownContent.findAll('.CoveoFacet');
    $$(facetList[facetList.length - 1]).addClass('coveo-last-facet');

    this.dropdownHeader.el.style.zIndex = ResponsiveFacets.ACTIVE_FACET_HEADER_Z_INDEX;

    this.dropdownContent.addClass('coveo-facet-dropdown-content');
    this.dropdownHeader.addClass('coveo-dropdown-header-active');

    document.documentElement.appendChild(this.popupBackground.el);
    window.getComputedStyle(this.popupBackground.el).opacity;
    this.popupBackground.el.style.opacity = ResponsiveFacets.TRANSPARENT_BACKGROUND_OPACITY;
    this.dropdownContent.el.style.display = '';
    let width = 0.35 * this.coveoRoot.el.offsetWidth;
    if (width <= ResponsiveFacets.FACET_DROPDOWN_MIN_WIDTH) {
      width = ResponsiveFacets.FACET_DROPDOWN_MIN_WIDTH;
    }
    this.dropdownContent.el.style.width = width.toString() + 'px';

    PopupUtils.positionPopup(this.dropdownContent.el, this.tabSection.el, this.coveoRoot.el, this.coveoRoot.el,
      { horizontal: HorizontalAlignment.INNERRIGHT, vertical: VerticalAlignment.BOTTOM });
  }

  private detachDropdown() {
    let facetList = this.dropdownContent.findAll('.CoveoFacet');
    $$(facetList[facetList.length - 1]).removeClass('coveo-last-facet');

    this.dropdownHeader.el.style.zIndex = '';

    window.getComputedStyle(this.popupBackground.el).opacity;
    this.popupBackground.el.style.opacity = '0';

    this.dropdownContent.el.style.display = 'none';
    this.dropdownContent.removeClass('coveo-facet-dropdown-content');
    this.dropdownHeader.removeClass('coveo-dropdown-header-active');
  }

  private enableFacetPreservePosition() {
    _.each(this.facets, facet => {
      facet.options.preservePosition = true;
    });
  }

  private disableFacetPreservePosition() {
    _.each(this.facets, facet => {
      facet.options.preservePosition = false;
    });
  }

  private nuke() {

  }
}
