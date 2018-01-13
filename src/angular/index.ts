import {
    AfterContentInit, ChangeDetectionStrategy, Component, ContentChild, Directive, DoCheck, ElementRef,
    EmbeddedViewRef, EventEmitter, Host, Input, IterableDiffer, IterableDiffers, NgModule, NO_ERRORS_SCHEMA, OnDestroy,
    Output, TemplateRef, ViewChild, ViewContainerRef, ɵisListLikeIterable as isListLikeIterable
} from '@angular/core';
import { getSingleViewRecursive, registerElement } from 'nativescript-angular/element-registry';
import { KeyedTemplate, View } from 'tns-core-modules/ui/core/view';
import { ObservableArray } from 'tns-core-modules/data/observable-array';
import { profile } from 'tns-core-modules/profiling';
import { LayoutBase } from 'tns-core-modules/ui/layouts/layout-base';
import { FancyListViewError, FancyListViewLog, ITEMLOADING } from '../fancy-list-view.common';
import { FancyListView,} from '../';
import { LayoutType } from '../fancy-list-view.common';
const NG_VIEW = '_ngViewRef';

registerElement('FancyListView', () => require('../').FancyListView);

export interface ComponentView {
    rootNodes: Array<any>;

    destroy(): void;
}

export type RootLocator = (nodes: Array<any>, nestLevel: number) => View;

export function getItemViewRoot(viewRef: ComponentView,
                                rootLocator: RootLocator = getSingleViewRecursive): View {
    return rootLocator(viewRef.rootNodes, 0);
}

export class FancyListViewItemContext {
    constructor(public $implicit?: any,
                public item?: any,
                public index?: number,
                public even?: boolean,
                public odd?: boolean) {
    }
}

export interface SetupItemViewArgs {
    view: EmbeddedViewRef<any>;
    data: any;
    index: number;
    context: FancyListViewItemContext;
}

@Component({
    selector: 'FancyListView',
    template: `
        <DetachedContainer>
            <Placeholder #loader></Placeholder>
        </DetachedContainer>`,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FancyListViewComponent
    implements DoCheck, OnDestroy, AfterContentInit {
    itemTemplate: TemplateRef<FancyListViewItemContext>;
    @ViewChild('loader', { read: ViewContainerRef })
    loader: ViewContainerRef;
    @Output() public setupItemView = new EventEmitter<SetupItemViewArgs>();
    @ContentChild(TemplateRef)
    itemTemplateQuery: TemplateRef<FancyListViewItemContext>;
    private _differ: IterableDiffer<KeyedTemplate>;
    private listView: FancyListView;
    private _templateMap: Map<string, KeyedTemplate>;

    constructor(el: ElementRef, private _iterableDiffers: IterableDiffers) {
        this.listView = el.nativeElement;
        this.listView.on(ITEMLOADING, this.onItemLoading, this);
    }

    private _items: any;

    @Input()
    get items() {
        return this._items;
    }

    set items(value: any) {
        this._items = value;
        let needDiffer = true;
        if (value instanceof ObservableArray) {
            needDiffer = false;
        }
        if (needDiffer && !this._differ && isListLikeIterable(value)) {
            this._differ = this._iterableDiffers
                .find(this._items)
                .create((_index, item) => {
                    return item;
                });
        }
        this.listView.items = this._items;
    }

    get nativeElement() {
        return this.listView;
    }

    public ngAfterContentInit() {
        this.setItemTemplates();
    }

    public registerTemplate(key: string,
                            template: TemplateRef<FancyListViewItemContext>) {
        if (!this._templateMap) {
            this._templateMap = new Map<string, KeyedTemplate>();
        }

        const keyedTemplate = {
            key,
            createView: () => {
                const viewRef = this.loader.createEmbeddedView(
                    template,
                    new FancyListViewItemContext(),
                    0
                );
                const resultView = getItemViewRoot(viewRef);
                resultView[NG_VIEW] = viewRef;

                return resultView;
            }
        };

        this._templateMap.set(key, keyedTemplate);
    }

    ngOnDestroy() {
        this.listView.off(ITEMLOADING, this.onItemLoading, this);
    }

    @profile
    public onItemLoading(args: any) {
        if (!args.view && !this.itemTemplate) {
            return;
        }

        const index = args.index;
        const items = (<any>args.object).items;
        const currentItem =
            typeof items.getItem === 'function' ? items.getItem(index) : items[index];
        let viewRef: EmbeddedViewRef<FancyListViewItemContext>;
        if (args.view) {
            viewRef = args.view[NG_VIEW];
            // Getting angular view from original element (in cases when ProxyViewContainer
            // is used NativeScript internally wraps it in a StackLayout)
            if (
                !viewRef &&
                args.view instanceof LayoutBase &&
                args.view.getChildrenCount() > 0
            ) {
                viewRef = args.view.getChildAt(0)[NG_VIEW];
            }

            if (!viewRef) {
                FancyListViewError(
                    'ViewReference not found for item ' +
                    index +
                    '. View recycling is not working'
                );
            }
        }

        if (!viewRef) {
            FancyListViewLog(
                'onItemLoading: ' + index + ' - Creating view from template'
            );
            viewRef = this.loader.createEmbeddedView(
                this.itemTemplate,
                new FancyListViewItemContext(),
                0
            );
            args.view = getItemViewRoot(viewRef);
            args.view[NG_VIEW] = viewRef;
        }

        this.setupViewRef(viewRef, currentItem, index);

        this.detectChangesOnChild(viewRef, index);
    }

    public setupViewRef(viewRef: EmbeddedViewRef<FancyListViewItemContext>,
                        data: any,
                        index: number): void {
        const context = viewRef.context;
        context.$implicit = data;
        context.item = data;
        context.index = index;
        context.even = index % 2 === 0;
        context.odd = !context.even;

        (this.setupItemView as any).next({
            view: viewRef,
            data: data,
            index: index,
            context: context
        });
    }

    ngDoCheck() {
        if (this._differ) {
            FancyListViewLog('ngDoCheck() - execute differ');
            const changes = this._differ.diff(this._items);
            if (changes) {
                FancyListViewLog('ngDoCheck() - refresh');
                this.listView.refresh();
            }
        }
    }

    private setItemTemplates() {
        this.itemTemplate = this.itemTemplateQuery;

        if (this._templateMap) {
            const templates: KeyedTemplate[] = [];
            this._templateMap.forEach(value => {
                templates.push(value);
            });
            this.listView.itemTemplates = templates;
        }
    }

    @profile
    private detectChangesOnChild(viewRef: EmbeddedViewRef<FancyListViewItemContext>,
                                 index: number) {
        FancyListViewLog('Manually detect changes in child: ' + index);
        viewRef.markForCheck();
        viewRef.detectChanges();
    }
}

@Directive({ selector: '[flvTemplateKey]' })
export class TemplateKeyDirective {
    constructor(private templateRef: TemplateRef<any>,
                @Host() private listView: FancyListViewComponent) {
    }

    @Input()
    set flvTemplateKey(value: any) {
        if (this.listView && this.templateRef) {
            this.listView.registerTemplate(value, this.templateRef);
        }
    }
}

@NgModule({
    declarations: [FancyListViewComponent, TemplateKeyDirective],
    exports: [FancyListViewComponent, TemplateKeyDirective],
    schemas: [NO_ERRORS_SCHEMA]
})
export class FancyListViewModule {
}
