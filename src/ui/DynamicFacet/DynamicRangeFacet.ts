import 'styling/DynamicFacet/_DynamicFacet';
import { Initialization } from '../Base/Initialization';
import { DynamicFacet, IDynamicFacetOptions } from './DynamicFacet';
import { ComponentOptions } from '../Base/ComponentOptions';
import { IComponentBindings } from '../Base/ComponentBindings';
import { exportGlobally } from '../../GlobalExports';
import { l } from '../../strings/Strings';
import { FacetType } from '../../rest/Facet/FacetRequest';
import { IRangeValue } from '../../rest/RangeValue';
import { DynamicFacetValues } from './DynamicFacetValues/DynamicFacetValues';
import { DynamicRangeFacetValueCreator } from './DynamicFacetValues/DynamicRangeFacetValueCreator';
import { DynamicRangeFacetQueryController } from '../../controllers/DynamicRangeFacetQueryController';

/**
 * The allowed values for the [`valueFormat`]{@link DynamicRangeFacet.options.valueFormat} option
 * of the [`DynamicRangeFacet`]{@link DynamicRangeFacet} component.
 */
export enum DynamicRangeFacetValueFormat {
  /**
   * Format range values as localized numeric strings.
   */
  number = 'number',
  /**
   * Format range values as localized date strings.
   */
  date = 'date'
}

export interface IDynamicRangeFacetOptions extends IDynamicFacetOptions {
  valueSeparator?: string;
  valueFormat?: DynamicRangeFacetValueFormat;
  ranges?: IRangeValue[];
}

/**
 * A `DynamicRangeFacet` is a [facet](https://docs.coveo.com/en/198/) whose values are expressed as ranges.
 *
 * You must set the [`field`]{@link DynamicFacet.options.field} option to a value targeting a numeric or date [field](https://docs.coveo.com/en/200/)
 * in your index for this component to work.
 *
 * This component extends the [`DynamicFacet`]{@link DynamicFacet} component and supports all `DynamicFacet` options except:
 *
 * - [`enableFacetSearch`]{@link DynamicFacet.options.enableFacetSearch}
 * - [`useLeadingWildcardInFacetSearch`]{@link DynamicFacet.options.useLeadingWildcardInFacetSearch}
 * - [`enableMoreLess`]{@link DynamicFacet.options.enableMoreLess}
 * - [`valueCaption`]{@link DynamicFacet.options.valueCaption}
 *
 *  @notSupportedIn salesforcefree
 */
export class DynamicRangeFacet extends DynamicFacet implements IComponentBindings {
  static ID = 'DynamicRangeFacet';
  static parent = DynamicFacet;
  static doExport = () => exportGlobally({ DynamicRangeFacet });

  static options: IDynamicRangeFacetOptions = {
    /**
     * The label to insert between the minimum and maximum value of each range displayed in the facet.
     *
     * **Default:** The localized string for `to`.
     *
     * @examples until, up to
     *
     * **Default:** The localized string for `to`.
     */
    valueSeparator: ComponentOptions.buildLocalizedStringOption({ defaultValue: l('To'), section: 'CommonOptions' }),
    /**
     * The string format to apply to the minimum and maximum value of each range displayed in the facet.
     *
     * **Default:** [`number`]{@link DynamicRangeFacetValueFormat.number}
     *
     * @examples date
     */
    valueFormat: ComponentOptions.buildStringOption({ defaultValue: DynamicRangeFacetValueFormat.number, section: 'CommonOptions' }),
    /**
     * The list of [range values]{@link IRangeValue} to request (see [Requesting Specific FacetRange Values](https://docs.coveo.com/en/2790/)).
     *
     * **Required:** Specifying a value for this option is required for the component to work.
     */
    ranges: ComponentOptions.buildJsonOption<IRangeValue[]>({ required: true })
  };

  /**
   * Creates a new `DynamicRangeFacet` instance.
   *
   * @param element The element from which to instantiate the component.
   * @param options The component options.
   * @param bindings The component bindings. Automatically resolved by default.
   */
  constructor(public element: HTMLElement, public options: IDynamicRangeFacetOptions, bindings?: IComponentBindings) {
    super(element, ComponentOptions.initComponentOptions(element, DynamicRangeFacet, options), bindings, DynamicRangeFacet.ID);

    this.disableUnavailableOptions();
  }

  protected initValues() {
    this.values = new DynamicFacetValues(this, DynamicRangeFacetValueCreator);

    if (this.options.ranges) {
      this.values.createFromRanges(this.options.ranges);
    }
  }

  protected initDynamicFacetQueryController() {
    this.dynamicFacetQueryController = new DynamicRangeFacetQueryController(this);
  }

  private disableUnavailableOptions() {
    this.options.enableFacetSearch = false;
    this.options.useLeadingWildcardInFacetSearch = false;
    this.options.enableMoreLess = false;
    this.options.valueCaption = {};
  }

  public get facetType(): FacetType {
    if (this.options.valueFormat === DynamicRangeFacetValueFormat.date) {
      return FacetType.dateRange;
    }

    return FacetType.numericalRange;
  }

  public showMoreValues() {
    this.logger.warn('The "showMoreValues" method is not available on the "DynamicRangeFacet" component');
  }

  public showLessValues() {
    this.logger.warn('The "showLessValues" method is not available on the "DynamicRangeFacet" component');
  }

  public async triggerNewIsolatedQuery() {
    this.logger.warn('The "triggerNewIsolatedQuery" method is not available on the "DynamicRangeFacet" component');
  }
}

Initialization.registerAutoCreateComponent(DynamicRangeFacet);
DynamicRangeFacet.doExport();
