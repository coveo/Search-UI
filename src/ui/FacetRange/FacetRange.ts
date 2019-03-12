/// <reference path='../Facet/Facet.ts' />

import { IFacetOptions, Facet } from '../Facet/Facet';
import { IRangeValue } from '../../rest/RangeValue';
import { ComponentOptions } from '../Base/ComponentOptions';
import { IComponentBindings } from '../Base/ComponentBindings';
import { Utils } from '../../utils/Utils';
import { TemplateHelpers } from '../Templates/TemplateHelpers';
import { IDateToStringOptions, DateUtils } from '../../utils/DateUtils';
import { FacetRangeQueryController } from '../../controllers/FacetRangeQueryController';
import { IGroupByResult } from '../../rest/GroupByResult';
import { Initialization } from '../Base/Initialization';
import * as Globalize from 'globalize';
import { exportGlobally } from '../../GlobalExports';
import { IIndexFieldValue } from '../../rest/FieldValue';
import { IGroupByValue } from '../../rest/GroupByValue';
import { ResponsiveFacetOptions } from '../ResponsiveComponents/ResponsiveFacetOptions';
import { ResponsiveFacets } from '../ResponsiveComponents/ResponsiveFacets';

export interface IFacetRangeOptions extends IFacetOptions {
  ranges?: IRangeValue[];
  dateField?: boolean;
}
/**
 * A `FacetRange` is a [facet](https://docs.coveo.com/en/198/) whose values are expressed as ranges.
 *
 * You must set the [`field`]{@link Facet.options.field} option to a value targeting a numeric or date [field](https://docs.coveo.com/en/200/) in your index for this component to work.
 *
 * This component extends the [`Facet`]{@link Facet} component and supports all `Facet` options except:
 *
 * - **Settings** menu options
 *   - [`enableSettings`]{@link Facet.options.enableSettings}
 *   - [`enableSettingsFacetState`]{@link Facet.options.enableSettingsFacetState}
 *   - [`enableCollapse`]{@link Facet.options.enableCollapse}
 *   - [`availableSorts`]{@link Facet.options.availableSorts}
 *   - [`customSort`]{@link Facet.options.customSort}
 *   - [`computedFieldCaption`]{@link Facet.options.computedFieldCaption}
 * - **Facet Search** options
 *   - [`enableFacetSearch`]{@link Facet.options.enableFacetSearch}
 *   - [`facetSearchDelay`]{@link Facet.options.facetSearchDelay}
 *   - [`facetSearchIgnoreAccents`]{@link Facet.options.facetSearchIgnoreAccents}
 *   - [`numberOfValuesInFacetSearch`]{@link Facet.options.numberOfValuesInFacetSearch}
 * - **More and Less** options
 *   - [`enableMoreLess`]{@link Facet.options.enableMoreLess}
 *   - [`pageSize`]{@link Facet.options.pageSize}
 *
 *  @notSupportedIn salesforcefree
 */
export class FacetRange extends Facet implements IComponentBindings {
  static ID = 'FacetRange';
  static parent = Facet;

  static doExport = () => {
    exportGlobally({
      FacetRange: FacetRange
    });
  };

  /**
   * The options for the component
   * @componentOptions
   */
  static options: IFacetRangeOptions = {
    /**
     * Whether the specified [`field`]{@link Facet.options.field} option value targets a date field in your index.
     *
     * This allows the component to correctly build the outgoing [Group By](https://docs.coveo.com/en/203/).
     *
     * **Default:** `false`.
     */
    dateField: ComponentOptions.buildBooleanOption({ defaultValue: false }),

    /**
     * The list of [range values]{@link IRangeValue} to request (see [Requesting Specific FacetRange Values](https://docs.coveo.com/en/2790/)).
     *
     * By default, the index automatically generates range values.
     *
     * **Note:**
     * > The index cannot automatically generate range values for a `FacetRange` whose [`field`]{@link Facet.options.field} option value references a dynamic field generated by a [query function](https://docs.coveo.com/en/232/). In such a case, you _must_ use the `ranges` option.
     */
    ranges: ComponentOptions.buildJsonOption<IRangeValue[]>(),
    ...ResponsiveFacetOptions
  };

  public options: IFacetRangeOptions;

  /**
   * Creates a new `FacetRange`.
   * @param element The HTML element on which to instantiate the component.
   * @param options The configuration options to apply when creating the component.
   * @param bindings The bindings required by the component.
   */
  constructor(public element: HTMLElement, options: IFacetRangeOptions, bindings?: IComponentBindings) {
    super(element, ComponentOptions.initComponentOptions(element, FacetRange, options), bindings, FacetRange.ID);

    this.options.enableFacetSearch = false;
    this.options.enableSettings = false;
    this.options.includeInOmnibox = false;
    this.options.enableMoreLess = false;
    ResponsiveFacets.init(this.root, this, this.options);
  }

  public getValueCaption(facetValue: any): string {
    if (Utils.exists(this.options.valueCaption) && typeof this.options.valueCaption == 'string') {
      return this.translateValueCaptionFromFunctionName(facetValue);
    }
    if (!Utils.exists(this.options.valueCaption) && this.options.dateField) {
      return this.translateValueCaptionFromDate(facetValue);
    }
    return super.getValueCaption(facetValue);
  }

  protected initFacetQueryController() {
    this.facetQueryController = new FacetRangeQueryController(this);
  }

  protected processNewGroupByResults(groupByResults: IGroupByResult) {
    if (groupByResults != null && this.options.ranges == null) {
      groupByResults.values.sort((valueA, valueB) => this.sortRangeGroupByResults(valueA, valueB));
    }
    super.processNewGroupByResults(groupByResults);
  }

  private sortRangeGroupByResults(valueA: IGroupByValue, valueB: IGroupByValue) {
    const startEndA = this.extractStartAndEndValue(valueA);
    const startEndB = this.extractStartAndEndValue(valueB);
    let firstValue: string;
    let secondValue: string;

    if (!startEndA) {
      firstValue = valueA.value;
    } else {
      firstValue = startEndA.start;
    }

    if (!startEndB) {
      secondValue = valueB.value;
    } else {
      secondValue = startEndB.start;
    }

    if (this.options.dateField) {
      return Date.parse(firstValue) - Date.parse(secondValue);
    }
    return Number(firstValue) - Number(secondValue);
  }

  private translateValueCaptionFromFunctionName(facetValue: IIndexFieldValue) {
    const { start, end } = this.extractStartAndEndValue(facetValue);
    if (start == null || end == null) {
      return null;
    }

    const helper = TemplateHelpers.getHelper(this.options.valueCaption);

    if (helper != null) {
      return `${helper.call(this, start)} - ${helper.call(this, end)}`;
    } else {
      const startConverted = start.match(/^[\+\-]?[0-9]+(\.[0-9]+)?$/) ? Number(start) : DateUtils.convertFromJsonDateIfNeeded(start);

      const endConverted = end.match(/^[\+\-]?[0-9]+(\.[0-9]+)?$/) ? Number(end) : DateUtils.convertFromJsonDateIfNeeded(end);

      return `${Globalize.format(startConverted, this.options.valueCaption)} - ${Globalize.format(
        endConverted,
        this.options.valueCaption
      )}`;
    }
  }

  private extractStartAndEndValue(facetValue: IIndexFieldValue) {
    const startAndEnd = /^(.*)\.\.(.*)$/.exec(facetValue.value);

    if (startAndEnd == null) {
      return null;
    }

    return {
      start: startAndEnd[1],
      end: startAndEnd[2]
    };
  }

  private translateValueCaptionFromDate(facetValue: IIndexFieldValue) {
    const helper = TemplateHelpers.getHelper('dateTime');
    const { start, end } = this.extractStartAndEndValue(facetValue);
    const helperOptions: IDateToStringOptions = {
      alwaysIncludeTime: false,
      includeTimeIfThisWeek: false,
      includeTimeIfToday: false,
      omitYearIfCurrentOne: false,
      useTodayYesterdayAndTomorrow: false,
      useWeekdayIfThisWeek: false
    };
    return `${helper(start, helperOptions)} - ${helper(end, helperOptions)}`;
  }
}
Initialization.registerAutoCreateComponent(FacetRange);
