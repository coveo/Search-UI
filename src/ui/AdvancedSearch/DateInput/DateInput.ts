import {IAdvancedSearchInput} from '../AdvancedSearchInput';
import {AdvancedSearchEvents} from '../../../events/AdvancedSearchEvents';
import {QueryBuilder} from '../../Base/QueryBuilder';
import {$$} from '../../../utils/Dom';

export class DateInput implements IAdvancedSearchInput {

  protected element: HTMLElement;

  constructor(public inputName: string) {
  }

  public build(): HTMLElement {
    let date = $$('div', { className: 'coveo-advanced-search-date-input-section' });
    let radioOption = $$('div', { className: 'coveo-radio' });
    let radio = $$('input', { type: 'radio', name: 'coveo-advanced-search-date', id: this.inputName });
    let label = $$('label', { className: 'coveo-advanced-search-label', 'for': this.inputName });
    label.text(this.inputName);

    radio.on('change', () => {
      this.deactivateAllInputs();
      this.activateSelectedInput();
    });

    radioOption.append(radio.el);
    radioOption.append(label.el);
    date.append(radioOption.el);
    this.element = date.el;
    this.bindRadioEvent();
    return this.element;
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public getValue(): string {
    return '';
  }

  public isSelected(): boolean {
    return this.getRadio().checked;
  }

  public updateQuery(queryBuilder: QueryBuilder) {
    let value = this.getValue();
    if (value) {
      queryBuilder.advancedExpression.add(this.getValue());
    }
  }

  protected getRadio(): HTMLInputElement {
    return <HTMLInputElement>$$(this.element).find('input');
  }

  private deactivateAllInputs() {
    let elements = $$(this.element.parentElement).findAll('fieldset');
    _.each(elements, (element) => {
      (<HTMLInputElement>element).disabled = true;
    });
  }

  private activateSelectedInput() {
    let elements = $$(this.element).findAll('fieldset');
    _.each(elements, (element) => {
      (<HTMLInputElement>element).disabled = false;
    });
  }

  protected onChange() {
    if (this.element) {
      $$(this.element).trigger(AdvancedSearchEvents.executeAdvancedSearch);
    }
  }

  private bindRadioEvent() {
    $$(this.getRadio()).on('change', () => {
      $$(this.element).trigger(AdvancedSearchEvents.executeAdvancedSearch);
    });
  }

}
