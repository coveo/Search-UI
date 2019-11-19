import { $$, Dom } from '../../../utils/Dom';
import { DynamicFacetValue, ValueRenderer } from './DynamicFacetValue';
import { DynamicFacetValueCheckbox } from './DynamicFacetValueCheckbox';
import { IDynamicFacet } from '../DynamicFacetInterface';

export class DynamicFacetValueRenderer implements ValueRenderer {
  private dom: Dom;
  private valueCheckbox: DynamicFacetValueCheckbox;

  constructor(private facetValue: DynamicFacetValue, private facet: IDynamicFacet) {}

  public render() {
    this.dom = $$('li', {
      className: 'coveo-dynamic-facet-value',
      dataValue: this.facetValue.value
    });

    this.toggleSelectedClass();
    this.renderCheckbox();
    this.addFocusAndBlurEventListeners();

    return this.dom.el;
  }

  private toggleSelectedClass() {
    this.dom.toggleClass('coveo-selected', this.facetValue.isSelected);
  }

  private renderCheckbox() {
    this.valueCheckbox = new DynamicFacetValueCheckbox(this.facetValue, this.selectAction.bind(this));
    this.dom.append(this.valueCheckbox.element);
  }

  private addFocusAndBlurEventListeners() {
    const checkboxButton = $$(this.valueCheckbox.element).find('button');
    $$(checkboxButton).on('focusin', () => this.onFocusIn());
    $$(checkboxButton).on('focusout', () => this.onFocusOut());
  }

  private onFocusIn() {
    this.dom.addClass('coveo-focused');
  }

  private onFocusOut() {
    this.dom.removeClass('coveo-focused');
  }

  private selectAction() {
    this.facet.toggleSelectValue(this.facetValue.value);
    this.toggleSelectedClass();
    this.facet.enableFreezeCurrentValuesFlag();
    this.facet.enableFreezeFacetOrderFlag();
    this.facet.scrollToTop();
    this.facet.triggerNewQuery(() => this.facetValue.logSelectActionToAnalytics());
  }
}
