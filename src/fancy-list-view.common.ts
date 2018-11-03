import {
    CoercibleProperty,
    KeyedTemplate,
    makeParser,
    makeValidator,
    PercentLength,
    Property,
    Template,
    View
} from 'tns-core-modules/ui/core/view';
import { parse, parseMultipleTemplates } from 'tns-core-modules/ui/builder';
import { Label } from 'tns-core-modules/ui/label/label';
import { messageType, write } from 'tns-core-modules/trace';
import { Observable } from 'tns-core-modules/data/observable';
import { ChangedData, ObservableArray } from 'tns-core-modules/data/observable-array';
import { addWeakEventListener, removeWeakEventListener } from 'tns-core-modules/ui/core/weak-event-listener';

export const ITEMLOADING = 'itemLoading';
export const LOADMOREITEMS = 'loadMoreItems';
export const ITEMTAP = 'itemTap';
export const SCROLLEVENT = 'scroll';

export type Orientation = 'horizontal' | 'vertical';
export * from 'tns-core-modules/ui/core/view';
export namespace knownTemplates {
    export const itemTemplate = 'itemTemplate';
}

export namespace knownMultiTemplates {
    export const itemTemplates = 'itemTemplates';
}

export namespace knownCollections {
    export const items = 'items';
}

export const fancyListViewTraceCategory = 'ns-fancy-list-view';

export function FancyListViewLog(message: string): void {
    write(message, fancyListViewTraceCategory);
}

export function FancyListViewError(message: string): void {
    write(message, fancyListViewTraceCategory, messageType.error);
}

export interface ItemEventData {
    eventName: string;
    object: any;
    index: number;
    view: View;
    android: any;
    ios: any;
}

export interface ItemsSource {
    length: number;

    getItem(index: number): any;
}

const autoEffectiveItemHeight = 100;
const autoEffectiveItemWidth = 100;

export abstract class FancyListViewBase extends View {
    // TODO: get rid of such hacks.
    public static knownFunctions = ['itemTemplateSelector', 'itemIdGenerator']; // See component-builder.ts isKnownFunction
    public hideScrollBar: boolean;
    public max: PercentLength;
    public min: PercentLength;
    public _itemWidth: any;
    public _itemHeight: any;
    public itemWidth: PercentLength;
    public itemHeight: PercentLength;
    public layoutType: LayoutType;
    public spanCount: number;
    public items: any[] | ItemsSource;
    public itemTemplate: string | Template;
    public static itemLoadingEvent = ITEMLOADING;
    public static itemTapEvent = ITEMTAP;
    public static loadMoreItemsEvent = LOADMOREITEMS;
    public static scrollEvent = SCROLLEVENT;
    public _defaultTemplate: KeyedTemplate = {
        key: 'default',
        createView: () => {
            if (this.itemTemplate) {
                return parse(this.itemTemplate, this);
            }
            return undefined;
        }
    };
    public _itemTemplatesInternal = new Array<KeyedTemplate>(
        this._defaultTemplate
    );
    public itemTemplates: string | Array<KeyedTemplate>;
    public _innerWidth: number = 0;
    public _innerHeight: number = 0;
    public _effectiveItemHeight: number;
    public _effectiveItemWidth: number;
    public orientation: Orientation;
    private _itemTemplateSelectorBindable = new Label();

    private _itemIdGenerator: (item: any, index: number, items: any) => number = (_item: any,
                                                                                  index: number) => index

    get itemIdGenerator(): (item: any, index: number, items: any) => number {
        return this._itemIdGenerator;
    }

    set itemIdGenerator(generatorFn: (item: any, index: number, items: any) => number) {
        this._itemIdGenerator = generatorFn;
    }

    private _itemTemplateSelector: (item: any,
                                    index: number,
                                    items: any) => string;

    get itemTemplateSelector(): | string
        | ((item: any, index: number, items: any) => string) {
        return this._itemTemplateSelector;
    }

    set itemTemplateSelector(value: string | ((item: any, index: number, items: any) => string)) {
        if (typeof value === 'string') {
            this._itemTemplateSelectorBindable.bind({
                sourceProperty: null,
                targetProperty: 'templateKey',
                expression: value
            });
            this._itemTemplateSelector = (item: any, index: number, items: any) => {
                item['$index'] = index;
                this._itemTemplateSelectorBindable.bindingContext = item;
                return this._itemTemplateSelectorBindable.get('templateKey');
            };
        } else if (typeof value === 'function') {
            this._itemTemplateSelector = value;
        }
    }


    public onLayout(left: number, top: number, right: number, bottom: number) {
        super.onLayout(left, top, right, bottom);
        this._innerWidth =
            right - left - this.effectivePaddingLeft - this.effectivePaddingRight;

        this._innerHeight =
            bottom - top - this.effectivePaddingTop - this.effectivePaddingBottom;

        this._effectiveItemWidth = PercentLength.toDevicePixels(
            this.itemWidth,
            autoEffectiveItemWidth,
            this._innerWidth
        );

        this._effectiveItemHeight = PercentLength.toDevicePixels(
            this.itemHeight,
            autoEffectiveItemHeight,
            this._innerHeight
        );
    }

    abstract refresh(): void;

    public _getItemTemplate(index: number): KeyedTemplate {
        let templateKey = 'default';
        if (this.itemTemplateSelector) {
            let dataItem = this._getDataItem(index);
            templateKey = this._itemTemplateSelector(dataItem, index, this.items);
        }

        for (
            let i = 0, length = this._itemTemplatesInternal.length;
            i < length;
            i++
        ) {
            if (this._itemTemplatesInternal[i].key === templateKey) {
                return this._itemTemplatesInternal[i];
            }
        }
        // This is the default template
        return this._itemTemplatesInternal[0];
    }

    public _prepareItem(item: View, index: number) {
        if (item) {
            item.bindingContext = this._getDataItem(index);
        }
    }

    public _getDefaultItemContent(index: number): View {
        let lbl = new Label();
        lbl.bind({
            targetProperty: 'text',
            sourceProperty: '$value'
        });
        return lbl;
    }

    _updateNativeItems(args: ChangedData<any>): void {
        this.refresh();
    }

    private _getDataItem(index: number): any {
        let thisItems = <ItemsSource>this.items;
        return (thisItems && thisItems.getItem) ? thisItems.getItem(index) : thisItems[index];
    }
}

export type LayoutType = 'grid' | 'linear' | 'staggered';

export enum LayoutTypeOptions {
    GRID = 'grid',
    LINEAR = 'linear',
    STAGGERED = 'staggered'
}


export const itemsProperty = new Property<FancyListViewBase, any[] | ItemsSource>({
    name: 'items',
    valueChanged: (target, oldValue: any, newValue: any) => {
        if (oldValue instanceof Observable) {
            removeWeakEventListener(
                oldValue,
                ObservableArray.changeEvent,
                target._updateNativeItems,
                target
            );
        }

        if (newValue instanceof Observable) {
            addWeakEventListener(
                newValue,
                ObservableArray.changeEvent,
                target._updateNativeItems,
                target
            );
        }

        target.refresh();
    }
});
itemsProperty.register(FancyListViewBase);

export const itemTemplateProperty = new Property<FancyListViewBase,
    string | Template>({
    name: 'itemTemplate',
    affectsLayout: true,
    valueChanged: target => {
        target.refresh();
    }
});
itemTemplateProperty.register(FancyListViewBase);

export const itemTemplatesProperty = new Property<FancyListViewBase,
    string | Array<KeyedTemplate>>({
    name: 'itemTemplates',
    affectsLayout: true,
    valueConverter: value => {
        if (typeof value === 'string') {
            return parseMultipleTemplates(value);
        }
        return value;
    }
});
itemTemplatesProperty.register(FancyListViewBase);

export const layoutTypeProperty = new Property<FancyListViewBase, LayoutType>({
    name: 'layoutType',
    affectsLayout: true,
});
layoutTypeProperty.register(FancyListViewBase);

export const spanCountProperty = new Property<FancyListViewBase, number>({
    name: 'spanCount',
    defaultValue: 1,
    affectsLayout: true,
    valueConverter: v => parseInt(v, 10)
});
spanCountProperty.register(FancyListViewBase);

const defaultItemWidth: PercentLength = 'auto';
export const itemWidthProperty = new CoercibleProperty<FancyListViewBase,
    PercentLength>({
    name: 'itemWidth',
    affectsLayout: true,
    defaultValue: {value: 1, unit: '%'},
    equalityComparer: PercentLength.equals,
    valueConverter: PercentLength.parse,
    coerceValue: (target, value) => {
        // We coerce to default value if we don't have display density.
        return target.nativeView ? value : defaultItemWidth;
    },
    valueChanged: (target, oldValue, newValue: any) => {
        target._itemWidth = newValue;
        target._effectiveItemWidth = PercentLength.toDevicePixels(
            newValue,
            autoEffectiveItemWidth,
            target._innerWidth
        );
        target.refresh();
    }
});
itemWidthProperty.register(FancyListViewBase);

const defaultItemHeight: PercentLength = 'auto';
export const itemHeightProperty = new CoercibleProperty<FancyListViewBase,
    PercentLength>({
    name: 'itemHeight',
    affectsLayout: true,
    defaultValue: {value: 0.2, unit: '%'},
    coerceValue: (target, value) => {
        // We coerce to default value if we don't have display density.
        return target.nativeView ? value : defaultItemHeight;
    },
    equalityComparer: PercentLength.equals,
    valueConverter: PercentLength.parse,
    valueChanged: (target, oldValue, newValue) => {
        target._itemHeight = newValue;
        target._effectiveItemHeight = PercentLength.toDevicePixels(
            newValue,
            autoEffectiveItemHeight,
            target._innerHeight
        );
        target.refresh();
    }
});

itemHeightProperty.register(FancyListViewBase);

const converter = makeParser<Orientation>(
    makeValidator('horizontal', 'vertical')
);
export const orientationProperty = new Property<FancyListViewBase, Orientation>(
    {
        name: 'orientation',
        defaultValue: 'vertical',
        affectsLayout: true,
        valueChanged: (target: FancyListViewBase,
                       oldValue: Orientation,
                       newValue: Orientation) => {
            target.refresh();
        },
        valueConverter: converter
    }
);

orientationProperty.register(FancyListViewBase);

export const maxProperty = new Property<FancyListViewBase, PercentLength>({
    name: 'max',
    affectsLayout: true,
    defaultValue: {value: 1, unit: '%'},
    equalityComparer: PercentLength.equals,
    valueConverter: PercentLength.parse
});

maxProperty.register(FancyListViewBase);

export const minProperty = new Property<FancyListViewBase, PercentLength>({
    name: 'min',
    affectsLayout: true,
    defaultValue: {value: 1 / 3, unit: '%'},
    equalityComparer: PercentLength.equals,
    valueConverter: PercentLength.parse
});

minProperty.register(FancyListViewBase);

export const hideScrollBarProperty = new Property<FancyListViewBase, boolean>({
    name: 'hideScrollBar'
});
hideScrollBarProperty.register(FancyListViewBase);
