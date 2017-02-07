import { Component } from '../Base/Component';
import { ComponentOptions } from '../Base/ComponentOptions';
import { IComponentBindings } from '../Base/ComponentBindings';
import { QueryEvents } from '../../events/QueryEvents';
import { Initialization } from '../Base/Initialization';
import { InitializationEvents } from '../../events/InitializationEvents';
import { Assert } from '../../misc/Assert';
import { ResultListEvents, IChangeLayoutEventArgs } from '../../events/ResultListEvents';
import { ResultLayoutEvents, IResultLayoutPopulateArgs } from '../../events/ResultLayoutEvents';
import { $$ } from '../../utils/Dom';
import { IQueryErrorEventArgs, IQuerySuccessEventArgs } from '../../events/QueryEvents';
import { QueryStateModel, QUERY_STATE_ATTRIBUTES } from '../../models/QueryStateModel';
import { MODEL_EVENTS, IAttributesChangedEventArg } from '../../models/Model';
import { analyticsActionCauseList, IAnalyticsResultsLayoutChange } from '../Analytics/AnalyticsActionListMeta';
import { IQueryResults } from '../../rest/QueryResults';
import { KeyboardUtils, KEYBOARD } from '../../utils/KeyboardUtils';
import _ = require('underscore');

export interface IResultLayoutOptions {
}

/**
 * The possible valid and supported layouts.
 *
 * See the [Result Layouts](https://developers.coveo.com/x/yQUvAg) documentation.
 */
export type ValidLayout = 'list' | 'card' | 'table';

/**
 * The ResultLayout component allows the end user to switch between multiple {@link ResultList} components that have
 * different {@link ResultList.options.layout} values.
 *
 * This component automatically populates itself with buttons to switch between the ResultList components that have a
 * valid layout value (see the {@link ValidLayout} type).
 *
 * See also the [Result Layouts](https://developers.coveo.com/x/yQUvAg) documentation.
 */
export class ResultLayout extends Component {
  static ID = 'ResultLayout';

  public static validLayouts: ValidLayout[] = ['list', 'card', 'table'];

  public currentLayout: string;


  private buttons: { [key: string]: HTMLElement };
  private resultLayoutSection: HTMLElement;

  static options: IResultLayoutOptions = {
  };

  /**
   * Creates a new ResultLayout component.
   * @param element The HTMLElement on which to instantiate the component.
   * @param options The options for the ResultLayout component.
   * @param bindings The bindings that the component requires to function normally. If not set, these will be
   * automatically resolved (with a slower execution time).
   */
  constructor(public element: HTMLElement, public options?: IResultLayoutOptions, bindings?: IComponentBindings) {
    super(element, ResultLayout.ID, bindings);
    this.options = ComponentOptions.initComponentOptions(element, ResultLayout, options);

    this.buttons = {};

    this.bind.onQueryState(MODEL_EVENTS.CHANGE_ONE, QUERY_STATE_ATTRIBUTES.LAYOUT, this.handleQueryStateChanged.bind(this));
    this.bind.onRootElement(QueryEvents.querySuccess, (args: IQuerySuccessEventArgs) => this.handleQuerySuccess(args));
    this.bind.onRootElement(QueryEvents.queryError, (args: IQueryErrorEventArgs) => this.handleQueryError(args));

    this.resultLayoutSection = $$(this.element).closest('.coveo-result-layout-section');

    this.populate();

    this.bind.oneRootElement(InitializationEvents.afterInitialization, () => this.handleQueryStateChanged());
  }

  /**
   * Changes the current layout.
   *
   * Also logs a `resultLayoutChange` event in the usage analytics with the new layout as metadeta.
   *
   * Triggers a new query.
   *
   * @param layout The new layout. The page must contain a valid {@link ResultList} component with a matching
   * {@link ResultList.options.layout} value for this method to work.
   */
  public changeLayout(layout: ValidLayout) {
    Assert.check(_.contains(_.keys(this.buttons), layout), 'Layout not available or invalid');

    if (layout !== this.currentLayout || this.getModelValue() === '') {

      this.setModelValue(layout);
      const lastResults = this.queryController.getLastResults();
      this.setLayout(layout, lastResults);
      if (lastResults) {
        this.usageAnalytics.logCustomEvent<IAnalyticsResultsLayoutChange>(analyticsActionCauseList.resultsLayoutChange, {
          resultsLayoutChangeTo: layout
        }, this.element);
      } else {
        this.usageAnalytics.logSearchEvent<IAnalyticsResultsLayoutChange>(analyticsActionCauseList.resultsLayoutChange, {
          resultsLayoutChangeTo: layout
        });
        this.queryController.executeQuery();
      }
    }
  }

  private setLayout(layout: ValidLayout, results?: IQueryResults) {
    if (this.currentLayout) {
      $$(this.buttons[this.currentLayout]).removeClass('coveo-selected');
    }
    $$(this.buttons[layout]).addClass('coveo-selected');
    this.currentLayout = layout;
    $$(this.element).trigger(ResultListEvents.changeLayout, <IChangeLayoutEventArgs>{ layout: layout, results: results });
  }

  private handleQuerySuccess(args: IQuerySuccessEventArgs) {
    if (args.results.results.length === 0 || !this.shouldShowSelector()) {
      this.hide();
    } else {
      this.show();
    }
  }

  private handleQueryStateChanged(args?: IAttributesChangedEventArg) {
    const modelLayout = this.getModelValue();
    const newLayout = _.find(_.keys(this.buttons), l => l === modelLayout);
    if (newLayout !== undefined) {
      this.setLayout(<ValidLayout>newLayout);
    } else {
      this.setLayout(<ValidLayout>_.keys(this.buttons)[0]);
    }
  }

  private handleQueryError(args: IQueryErrorEventArgs) {
    this.hide();
  }

  private populate() {
    let populateArgs: IResultLayoutPopulateArgs = { layouts: [] };
    $$(this.root).trigger(ResultLayoutEvents.populateResultLayout, populateArgs);
    _.each(populateArgs.layouts, l => Assert.check(_.contains(ResultLayout.validLayouts, l), 'Invalid layout'));
    if (!_.isEmpty(populateArgs.layouts)) {
      _.each(populateArgs.layouts, l => this.addButton(l));
      if (!this.shouldShowSelector()) {
        this.hide();
      }
    }
  }

  /**
   * Gets the current layout.
   * @returns {string} The current layout (see the {@link ValidLayout} type for the list of possible return values).
   */
  public getCurrentLayout() {
    return this.currentLayout;
  }

  private addButton(layout?: string) {
    const btn = $$('span', { className: 'coveo-result-layout-selector', tabindex: 0 }, layout);
    btn.prepend($$('span', { className: `coveo-icon coveo-sprites-${layout}-layout` }).el);
    if (layout === this.currentLayout) {
      btn.addClass('coveo-selected');
    }
    const activateAction = () => this.changeLayout(<ValidLayout>layout);
    btn.on('click', activateAction);
    btn.on('keyup', KeyboardUtils.keypressAction(KEYBOARD.ENTER, activateAction));
    $$(this.element).append(btn.el);
    this.buttons[layout] = btn.el;
  }

  private hide() {
    const elem = this.resultLayoutSection || this.element;
    $$(elem).addClass('coveo-result-layout-hidden');
  }

  private show() {
    const elem = this.resultLayoutSection || this.element;
    $$(elem).removeClass('coveo-result-layout-hidden');
  }

  private getModelValue(): string {
    return this.queryStateModel.get(QueryStateModel.attributesEnum.layout);
  }

  private setModelValue(val: string) {
    this.queryStateModel.set(QueryStateModel.attributesEnum.layout, val);
  }

  private shouldShowSelector() {
    return _.keys(this.buttons).length > 1;
  }
}

Initialization.registerAutoCreateComponent(ResultLayout);
