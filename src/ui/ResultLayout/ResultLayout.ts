import {Component} from '../Base/Component';
import {ComponentOptions} from '../Base/ComponentOptions';
import {IComponentBindings} from '../Base/ComponentBindings';
import {QueryEvents} from '../../events/QueryEvents';
import {Initialization} from '../Base/Initialization';
import {InitializationEvents} from '../../events/InitializationEvents';
import {Assert} from '../../misc/Assert';
import {ResultListEvents, IChangeLayoutEventArgs} from '../../events/ResultListEvents';
import {ResultLayoutEvents, IResultLayoutPopulateArgs} from '../../events/ResultLayoutEvents';
import {$$} from '../../utils/Dom';
import {IQueryErrorEventArgs, IQuerySuccessEventArgs} from '../../events/QueryEvents';
import {QueryStateModel, QUERY_STATE_ATTRIBUTES} from '../../models/QueryStateModel';
import {MODEL_EVENTS, IAttributesChangedEventArg} from '../../models/Model';
import {analyticsActionCauseList, IAnalyticsResultsLayoutChange} from '../Analytics/AnalyticsActionListMeta';
import {IQueryResults} from '../../rest/QueryResults';

export interface IResultLayoutOptions {
}

/**
 * The possible valid and supported layout.
 */
export type ValidLayout = 'list' | 'card' | 'table';

/**
 * The ResultLayout component allows the user to switch between multiple {@link ResultList} components with
 * different layouts.
 *
 * It will automatically populate itself with buttons to switch between {@link ResultList} components that have a valid
 * `data-layout` attribute.
 */
export class ResultLayout extends Component {
  static ID = 'ResultLayout';

  /**
   * The possible valid and supported layout.
   */
  public static validLayouts: ValidLayout[] = ['list', 'card', 'table'];
  /**
   * The current active layout.
   */
  public currentLayout: string;


  private buttons: { [key: string]: HTMLElement };
  private resultLayoutSection: HTMLElement;

  /**
   * @componentOptions
   */
  static options: IResultLayoutOptions = {
  };

  /**
   * Creates a new ResultLayout component.
   * @param element The HTMLElement on which the component will be instantiated.
   * @param options The options for the ResultLayout component.
   * @param bindings The bindings that the component requires to function normally. If not set, they will be
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
   * Triggers a new query.
   *
   * @param layout The new layout. Possible values are `list`, `card` and `table`.
   * You need a valid {@link ResultList} component with the matching layout configured for this to work correctly end to
   * end.
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
   * Gets the current layout (`list`, `card` or `table`).
   * @returns {string} The current current layout.
   */
  public getCurrentLayout() {
    return this.currentLayout;
  }

  private addButton(layout?: string) {
    const btn = $$('span', { className: 'coveo-result-layout-selector' }, layout);
    btn.prepend($$('span', { className: `coveo-icon coveo-sprites-${layout}-layout` }).el);
    if (layout === this.currentLayout) {
      btn.addClass('coveo-selected');
    }
    btn.on('click', () => this.changeLayout(<ValidLayout>layout));
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
