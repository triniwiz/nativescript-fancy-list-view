import { ElementRef, TemplateRef, IterableDiffers, ViewContainerRef, AfterContentInit, DoCheck, OnDestroy, EventEmitter, EmbeddedViewRef } from '@angular/core';
import { View } from 'tns-core-modules/ui/core/view';
import { FancyListView } from '../';
export interface ComponentView {
    rootNodes: Array<any>;
    destroy(): void;
}
export declare type RootLocator = (nodes: Array<any>, nestLevel: number) => View;
export declare function getItemViewRoot(viewRef: ComponentView, rootLocator?: RootLocator): View;
export declare class FancyListViewItemContext {
    $implicit: any;
    item: any;
    index: number;
    even: boolean;
    odd: boolean;
    constructor($implicit?: any, item?: any, index?: number, even?: boolean, odd?: boolean);
}
export interface SetupItemViewArgs {
    view: EmbeddedViewRef<any>;
    data: any;
    index: number;
    context: FancyListViewItemContext;
}
export declare class FancyListViewComponent implements DoCheck, OnDestroy, AfterContentInit {
    private _iterableDiffers;
    private viewInitialized;
    private _selectedIndex;
    private _items;
    private _differ;
    private listView;
    itemTemplate: TemplateRef<FancyListViewItemContext>;
    private _templateMap;
    loader: ViewContainerRef;
    setupItemView: EventEmitter<SetupItemViewArgs>;
    itemTemplateQuery: TemplateRef<FancyListViewItemContext>;
    constructor(el: ElementRef, _iterableDiffers: IterableDiffers);
    ngAfterContentInit(): void;
    readonly nativeElement: FancyListView;
    items: any;
    private setItemTemplates();
    registerTemplate(key: string, template: TemplateRef<FancyListViewItemContext>): void;
    ngOnDestroy(): void;
    onItemLoading(args: any): void;
    setupViewRef(viewRef: EmbeddedViewRef<FancyListViewItemContext>, data: any, index: number): void;
    private detectChangesOnChild(viewRef, index);
    ngDoCheck(): void;
}
export declare class TemplateKeyDirective {
    private templateRef;
    private listView;
    constructor(templateRef: TemplateRef<any>, listView: FancyListViewComponent);
    pagerTemplateKey: any;
}
export declare class FancyListViewModule {
}
