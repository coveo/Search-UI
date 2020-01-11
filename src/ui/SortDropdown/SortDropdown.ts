import 'styling/_SortDropdown';
import { each, findIndex } from 'underscore';
import { exportGlobally } from '../../GlobalExports';
import { IQuerySuccessEventArgs, QueryEvents } from '../../events/QueryEvents';
import { IAttributeChangedEventArg, MODEL_EVENTS } from '../../models/Model';
import { QUERY_STATE_ATTRIBUTES, QueryStateModel } from '../../models/QueryStateModel';
import { $$ } from '../../utils/Dom';
import { Component } from '../Base/Component';
import { IComponentBindings } from '../Base/ComponentBindings';
import { ComponentOptions } from '../Base/ComponentOptions';
import { Initialization } from '../Base/Initialization';
import { InitializationEvents } from '../../events/InitializationEvents';
import { Sort } from '../Sort/Sort';
import { SortCriteria } from '../Sort/SortCriteria';
import { Dropdown } from '../FormWidgets/Dropdown';
import { l } from '../../strings/Strings';

export interface ISortDropdownOptions {}

export interface ISortDropdownItem {
  criteria: SortCriteria;
  caption: string;
}

/**
 * The `SortDropdown` component renders a dropdown that the end user can interact with to select the criterion to use when sorting query results.
 */
export class SortDropdown extends Component {
  static ID = 'SortDropdown';

  static doExport = () => {
    exportGlobally({
      SortDropdown: SortDropdown
    });
  };

  /**
   * Options for the component
   * @componentOptions
   */
  static options: ISortDropdownOptions = {};

  private dropdown: Dropdown;
  private sortOptions: ISortDropdownItem[] = [];

  /**
   * Creates a new `SortDropdown` component instance.
   * @param element The HTMLElement on which to instantiate the component.
   * @param options The options for this component instance.
   * @param bindings The bindings that the component requires to function normally. If not set, these will be
   * automatically resolved (with a slower execution time).
   */
  constructor(public element: HTMLElement, public options?: ISortDropdownOptions, bindings?: IComponentBindings) {
    super(element, SortDropdown.ID, bindings);

    this.options = ComponentOptions.initComponentOptions(element, SortDropdown, options);

    this.bind.oneRootElement(InitializationEvents.afterInitialization, () => this.handleAfterInitialization());
    this.bind.onQueryState(MODEL_EVENTS.CHANGE_ONE, QUERY_STATE_ATTRIBUTES.SORT, (args: IAttributeChangedEventArg) =>
      this.handleQueryStateChanged(args)
    );
    this.bind.onRootElement(QueryEvents.querySuccess, (args: IQuerySuccessEventArgs) => this.handleQuerySuccess(args));
  }

  private handleAfterInitialization() {
    this.buildDropdown();
  }

  private buildDropdown() {
    this.sortOptions = this.getSortOptions();
    this.dropdown = new Dropdown(
      () => this.handleSelectChange(),
      this.getValuesForDropdown(),
      value => this.getCaptionForValue(value),
      l('SortBy')
    );
    this.element.appendChild(this.dropdown.getElement());
    this.update();
  }

  private getSortOptions() {
    const sortOptions: ISortDropdownItem[] = [];
    const sortElements = $$(this.element).findAll('.CoveoSort');

    each(sortElements, sortEl => {
      const sortInstance = <Sort>Component.get(sortEl, Sort);

      if (sortInstance.options.sortCriteria.length > 1) {
        this.logger.warn(
          `Each Sort component inside a SortDropdown should have only one sort criteria. Disabling ${
            sortInstance.options.caption
          } in the SortDropdown.`
        );
      } else {
        sortOptions.push({
          caption: sortInstance.options.caption,
          criteria: sortInstance.options.sortCriteria[0]
        });
      }
    });

    return sortOptions;
  }

  private getValuesForDropdown(): string[] {
    return this.sortOptions.map(option => option.criteria.toString());
  }

  private handleQueryStateChanged(data: IAttributeChangedEventArg) {
    this.update();
  }

  private update() {
    if (!this.dropdown) {
      return;
    }

    const sortCriteria = <string>this.queryStateModel.get(QueryStateModel.attributesEnum.sort);
    const optionIndex = this.getSortOptionIndex(sortCriteria);
    optionIndex > -1 && this.dropdown.select(optionIndex, false);

    $$(this.dropdown.getElement()).toggleClass('coveo-selected', optionIndex > -1);
  }

  private handleQuerySuccess(data: IQuerySuccessEventArgs) {
    data.results.results.length == 0 ? $$(this.element).addClass('coveo-hidden') : $$(this.element).removeClass('coveo-hidden');
  }

  private handleSelectChange() {
    const selectedValue = this.dropdown.getValue();
    $$(this.element)
      .find(`.CoveoSort[data-sort-criteria="${selectedValue}"]`)
      .click();
  }

  private getCaptionForValue(option: string) {
    const index = this.getSortOptionIndex(option);
    return index > -1 ? this.sortOptions[index].caption : '';
  }

  private getSortOptionIndex(option: string) {
    return findIndex(this.sortOptions, sortOption => sortOption.criteria.toString() === option);
  }
}

Initialization.registerAutoCreateComponent(SortDropdown);
