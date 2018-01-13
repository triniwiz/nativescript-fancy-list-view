import * as common from './fancy-list-view.common';
import {
    EventData, FancyListViewBase, hideScrollBarProperty, ItemEventData, ITEMLOADING, ITEMTAP,
    itemTemplatesProperty, LayoutType, LayoutTypeOptions, layoutTypeProperty, LOADMOREITEMS, Orientation,
    orientationProperty, paddingBottomProperty, paddingLeftProperty, paddingRightProperty, paddingTopProperty,
    spanCountProperty
} from './fancy-list-view.common';
import { KeyedTemplate, layout, Length, Observable, PercentLength, View } from 'tns-core-modules/ui/core/view';
import { profile } from 'tns-core-modules/profiling';
import { ProxyViewContainer } from 'tns-core-modules/ui/proxy-view-container';
import { StackLayout } from 'tns-core-modules/ui/layouts/stack-layout';

global.moduleMerge(common, exports);

export class FancyListView extends FancyListViewBase {
    heightMeasureSpec: number;
    _isDataDirty: any;
    widthMeasureSpec: number;
    _preparingCell: boolean;
    nativeViewProtected: UICollectionView;
    _layout: any;
    _delegate: any;
    _visibleRect: any;
    public _measuredMap: Map<number, CGSize>;
    _map: Map<FancyListViewCell, View>;
    private _dataSource;

    constructor() {
        super();
        this._layout = UICollectionViewFlowLinearLayoutImpl.initWithOwner(
            new WeakRef(this)
        );
        this._layout.minimumLineSpacing = 0;
        this._layout.minimumInteritemSpacing = 0;
        this.nativeViewProtected = this._ios = UICollectionView.alloc().initWithFrameCollectionViewLayout(
            CGRectZero,
            this._layout
        );

        this._ios.backgroundColor = UIColor.clearColor;
        this._ios.autoresizesSubviews = false;
        this._ios.autoresizingMask = UIViewAutoresizing.None;
        this._ios.registerClassForCellWithReuseIdentifier(
            FancyListViewCell.class(),
            this._defaultTemplate.key
        );

        this._ios.dataSource = this._dataSource = UICollectionViewDataSourceImpl.initWithOwner(
            new WeakRef(this)
        );

        this._delegate = UICollectionDelegateImpl.initWithOwner(new WeakRef(this));
        this._map = new Map<FancyListViewCell, View>();
        this._measuredMap = new Map<number, CGSize>();
        this._setNativeClipToBounds();
    }

    _ios: UICollectionView;

    get ios(): UICollectionView {
        return this._ios;
    }

    @profile
    public onLoaded() {
        super.onLoaded();
        if (this._isDataDirty) {
            this.refresh();
        }
        this._ios.delegate = this._delegate;
    }

    public onUnloaded() {
        this._ios.delegate = null;
        super.onUnloaded();
    }

    public _removeContainer(cell: FancyListViewCell,
                            indexPath?: NSIndexPath): void {
        let view = cell.view;
        // This is to clear the StackLayout that is used to wrap ProxyViewContainer instances.
        if (!(view.parent instanceof FancyListView)) {
            this._removeView(view.parent);
        }

        view.parent._removeView(view);
        this._map.delete(cell);
        if (indexPath) {
            this._measuredMap.delete(indexPath.row);
        }
    }

    public [layoutTypeProperty.setNative](type: LayoutType) {
        this.setLayoutType(type);
        return type;
    }

    public [spanCountProperty.setNative](count: number) {
        this.setSpanCount(count);
        return count;
    }

    public [orientationProperty.getDefault](): Orientation {
        if (
            this._layout.scrollDirection ===
            UICollectionViewScrollDirection.Horizontal
        ) {
            return 'horizontal';
        }

        return 'vertical';
    }

    public [orientationProperty.setNative](value: Orientation) {
        if (value === 'horizontal') {
            this._layout.scrollDirection = UICollectionViewScrollDirection.Horizontal;
        } else {
            this._layout.scrollDirection = UICollectionViewScrollDirection.Vertical;
        }
    }

    public eachChildView(callback: (child: View) => boolean): void {
        this._map.forEach((view, key) => {
            callback(view);
        });
    }

    public [hideScrollBarProperty.setNative](hide: boolean) {
        switch (this.orientation) {
            case 'horizontal':
                this._ios.showsHorizontalScrollIndicator = !hide;
                break;
            default:
                this._ios.showsVerticalScrollIndicator = !hide;
                break;
        }
    }

    public [paddingTopProperty.getDefault](): number {
        return this._layout.sectionInset.top;
    }

    public [paddingTopProperty.setNative](value: Length) {
        (this as any)._setPadding({
            top: layout.toDeviceIndependentPixels(this.effectivePaddingTop)
        });
    }

    public [paddingRightProperty.getDefault](): number {
        return this._layout.sectionInset.right;
    }

    public [paddingRightProperty.setNative](value: Length) {
        (this as any)._setPadding({
            right: layout.toDeviceIndependentPixels(this.effectivePaddingRight)
        });
    }

    public [paddingBottomProperty.getDefault](): number {
        return this._layout.sectionInset.bottom;
    }

    public [paddingBottomProperty.setNative](value: Length) {
        (this as any)._setPadding({
            bottom: layout.toDeviceIndependentPixels(this.effectivePaddingBottom)
        });
    }

    public [paddingLeftProperty.getDefault](): number {
        return this._layout.sectionInset.left;
    }

    public [paddingLeftProperty.setNative](value: Length) {
        (this as any)._setPadding({
            left: layout.toDeviceIndependentPixels(this.effectivePaddingLeft)
        });
    }

    public onLayout(left: number, top: number, right: number, bottom: number) {
        super.onLayout(left, top, right, bottom);
        this.setSpanCount(this.spanCount);
        this.setLayoutType(this.layoutType);
    }

    public measure(widthMeasureSpec: number, heightMeasureSpec: number): void {
        this.widthMeasureSpec = widthMeasureSpec;
        this.heightMeasureSpec = heightMeasureSpec;
        const changed = (this as any)._setCurrentMeasureSpecs(
            widthMeasureSpec,
            heightMeasureSpec
        );
        super.measure(widthMeasureSpec, heightMeasureSpec);
        if (changed) {
            this._ios.reloadData();
        }
    }

    public scrollToIndex(index: number) {
        if (this._ios) {
            this._ios.scrollToItemAtIndexPathAtScrollPositionAnimated(
                NSIndexPath.indexPathForItemInSection(index, 0),
                UICollectionViewScrollPosition.Top,
                false
            );
        }
    }

    public refresh() {
        this.setSpanCount(this.spanCount);
        this.setLayoutType(this.layoutType);

        // clear bindingContext when it is not observable because otherwise bindings to items won't reevaluate
        this._map.forEach((view) => {
            if (!(view.bindingContext instanceof Observable)) {
                view.bindingContext = null;
                view.requestLayout()
            }
        });
        if (this.isLoaded) {
            this._layout.invalidateLayout();
            this.requestLayout();
            this._isDataDirty = false;
        } else {
            this._isDataDirty = true;
        }
    }

    public _prepareCell(cell: FancyListViewCell, indexPath: NSIndexPath) {
        try {
            this._preparingCell = true;

            let view = cell.view;
            const template = this._getItemTemplate(indexPath.row);
            if (!view) {
                view = template.createView();
            }
            let args = <ItemEventData>{
                eventName: ITEMLOADING,
                object: this,
                index: indexPath.row,
                android: undefined,
                ios: cell,
                view: view
            };

            this.notify(args);

            view = args.view || this._getDefaultItemContent(indexPath.row);

            // Proxy containers should not get treated as layouts.
            // Wrap them in a real layout as well.
            if (view instanceof ProxyViewContainer) {
                let sp = new StackLayout();
                sp.addChild(view);
                view = sp;
            }

            // If cell is reused it have old content - remove it first.
            if (!cell.view) {
                cell.owner = new WeakRef(view);
            } else if (cell.view !== view) {
                this._removeContainer(cell, indexPath);
                (cell.view.ios as UIView).removeFromSuperview();
                cell.owner = new WeakRef(view);
            }

            this._prepareItem(view, indexPath.row);
            this._map.set(cell, view);

            if (view && !view.parent && view.ios) {
                cell.contentView.addSubview(view.ios);
                this._addView(view);
            }

            this._layoutCell(view, indexPath);
        } finally {
            this._preparingCell = false;
        }
    }

    public requestLayout(): void {
        // When preparing cell don't call super - no need to invalidate our measure when cell desiredSize is changed.
        if (!this._preparingCell) {
            super.requestLayout();
        }
    }

    _setNativeClipToBounds() {
        this._ios.clipsToBounds = true;
    }

    [itemTemplatesProperty.getDefault](): KeyedTemplate[] {
        return null;
    }

    [itemTemplatesProperty.setNative](value: KeyedTemplate[]) {
        this._itemTemplatesInternal = new Array<KeyedTemplate>(
            this._defaultTemplate
        );
        if (value) {
            for (let i = 0, length = value.length; i < length; i++) {
                this._ios.registerClassForCellWithReuseIdentifier(
                    FancyListViewCell.class(),
                    value[i].key
                );
            }
            this._itemTemplatesInternal = this._itemTemplatesInternal.concat(value);
        }

        this.refresh();
    }

    private setSpanCount(count: number) {
        this.setLayoutType(this.layoutType);
    }

    private setLayoutType(type: string) {
        const nativeView = this.nativeViewProtected;
        if (nativeView && this._innerWidth && this.layoutType) {
            let width;
            let height;
            this._measuredMap.clear();
            this._map.clear();
            switch (type) {
                case LayoutTypeOptions.GRID:
                    width = this._innerWidth / this.spanCount;
                    this._ios.collectionViewLayout = this._layout = UICollectionViewFlowGridLayoutImpl.initWithOwner(
                        new WeakRef(this)
                    );
                    break;
                case LayoutTypeOptions.STAGGERED:
                    width = this._innerWidth / this.spanCount;
                    this._ios.collectionViewLayout = this._layout = UICollectionViewFlowStaggeredLayoutImpl.initWithOwner(
                        new WeakRef(this)
                    );
                    break;
                default:
                    width = this._effectiveItemWidth;
                    height = this._effectiveItemHeight;
                    this._ios.collectionViewLayout = this._layout = UICollectionViewFlowLinearLayoutImpl.initWithOwner(
                        new WeakRef(this)
                    );
                    break;
            }
        }
    }

    private _setPadding(newPadding: {
        top?: number;
        right?: number;
        bottom?: number;
        left?: number;
    }) {
        const padding = {
            top: this._layout.sectionInset.top,
            right: this._layout.sectionInset.right,
            bottom: this._layout.sectionInset.bottom,
            left: this._layout.sectionInset.left
        };
        // tslint:disable-next-line:prefer-object-spread
        const newValue = Object.assign(padding, newPadding);
        this._layout.sectionInset = UIEdgeInsetsFromString(
            `{${newValue.top},${newValue.left},${newValue.bottom},${newValue.right}}`
        );
    }

    private _layoutCell(cellView: View, index: NSIndexPath) {
        if (cellView) {
            let width = this._effectiveItemWidth;
            let height = this._effectiveItemHeight;

            if (this._measuredMap && this._measuredMap.has(index.row)) {
                const size = this._measuredMap.get(index.row);
                width = layout.toDevicePixels(size.width);
                height = layout.toDevicePixels(size.height);
            } else if (this.layoutType === 'grid' || this.layoutType === 'staggered') {
                width = width / this.spanCount;
            }

            const widthMeasureSpec = layout.makeMeasureSpec(width, layout.EXACTLY);

            const heightMeasureSpec = layout.makeMeasureSpec(height, layout.EXACTLY);

            View.measureChild(
                this,
                cellView,
                widthMeasureSpec,
                heightMeasureSpec
            );
        }
    }
}

export class FancyListViewCell extends UICollectionViewCell {
    public owner: WeakRef<View>;

    public get view(): View {
        return this.owner ? this.owner.get() : null;
    }

    public willMoveToSuperview(newSuperview: UIView): void {
        let parent = <FancyListView>(this.view ? this.view.parent : null);

        // When inside ListView and there is no newSuperview this cell is
        // removed from native visual tree so we remove it from our tree too.
        if (parent && !newSuperview) {
            parent._removeContainer(this);
        }
    }
}

@ObjCClass(UICollectionViewDelegate, UICollectionViewDelegateFlowLayout)
class UICollectionDelegateImpl extends NSObject
    implements UICollectionViewDelegate, UICollectionViewDelegateFlowLayout {
    private _owner: WeakRef<FancyListView>;

    public static initWithOwner(owner: WeakRef<FancyListView>): UICollectionDelegateImpl {
        const delegate = UICollectionDelegateImpl.new() as UICollectionDelegateImpl;
        delegate._owner = owner;
        return delegate;
    }

    public collectionViewLayoutSizeForItemAtIndexPath(collectionView: UICollectionView,
                                                      collectionViewLayout: UICollectionViewLayout,
                                                      indexPath: NSIndexPath): CGSize {
        let owner = this._owner && this._owner.get() ? this._owner.get() : null;
        let width;
        let height;
        if (!owner) return CGSizeMake(0, 0);
        switch (owner.layoutType) {
            case LayoutTypeOptions.GRID:
                width = owner._effectiveItemWidth / owner.spanCount;
                height = owner._effectiveItemHeight;
                break;
            case LayoutTypeOptions.STAGGERED:
                width = owner._effectiveItemWidth / owner.spanCount;
                let size: CGSize;
                const max =
                    layout.toDeviceIndependentPixels(
                        PercentLength.toDevicePixels(owner.max)
                    ) || layout.toDeviceIndependentPixels(owner._effectiveItemHeight) * 2;
                const min =
                    layout.toDeviceIndependentPixels(
                        PercentLength.toDevicePixels(owner.min)
                    ) || layout.toDeviceIndependentPixels(owner._effectiveItemHeight);
                if (owner._measuredMap && owner._measuredMap.has(indexPath.row)) {
                    size = owner._measuredMap.get(indexPath.row);
                    width = layout.toDevicePixels(size.width);
                    height = layout.toDevicePixels(size.height);
                } else {
                    size = CGSizeMake(
                        layout.toDeviceIndependentPixels(
                            owner._effectiveItemWidth / owner.spanCount
                        ),
                        Math.floor(Math.random() * (max - min + 1) + min)
                    );
                    owner._measuredMap.set(indexPath.row, size);
                    width = layout.toDevicePixels(size.width);
                    height = layout.toDevicePixels(size.height);
                }
                break;
            default:
                width = owner._effectiveItemWidth;
                height = owner._effectiveItemHeight;
                break;
        }

        return CGSizeMake(
            layout.toDeviceIndependentPixels(width),
            layout.toDeviceIndependentPixels(height)
        );
    }

    public collectionViewWillDisplayCellForItemAtIndexPath(collectionView: UICollectionView,
                                                           cell: UICollectionViewCell,
                                                           indexPath: NSIndexPath) {
        const owner = this._owner.get();

        if (indexPath.row === owner.items.length - 1) {
            owner.notify<EventData>({
                eventName: LOADMOREITEMS,
                object: owner
            });
        }

        if (cell.preservesSuperviewLayoutMargins) {
            cell.preservesSuperviewLayoutMargins = false;
        }

        if (cell.layoutMargins) {
            cell.layoutMargins = UIEdgeInsetsZero;
        }
    }

    public collectionViewDidSelectItemAtIndexPath(collectionView: UICollectionView,
                                                  indexPath: NSIndexPath) {
        const cell = collectionView.cellForItemAtIndexPath(indexPath);
        const owner = this._owner.get();

        owner.notify<ItemEventData>({
            eventName: ITEMTAP,
            object: owner,
            index: indexPath.row,
            view: (cell as FancyListViewCell).view,
            android: undefined,
            ios: cell
        });

        cell.highlighted = false;

        return indexPath;
    }
}

@ObjCClass(UICollectionViewDataSource)
class UICollectionViewDataSourceImpl extends NSObject
    implements UICollectionViewDataSource {
    private _owner: WeakRef<FancyListView>;

    public static initWithOwner(owner: WeakRef<FancyListView>): UICollectionViewDataSourceImpl {
        const delegate = UICollectionViewDataSourceImpl.new() as UICollectionViewDataSourceImpl;
        delegate._owner = owner;
        return delegate;
    }

    public collectionViewCanMoveItemAtIndexPath(collectionView: UICollectionView,
                                                indexPath: NSIndexPath): boolean {
        return true;
    }

    public collectionViewCellForItemAtIndexPath(collectionView: UICollectionView,
                                                indexPath: NSIndexPath): UICollectionViewCell {
        const owner = this._owner && this._owner.get();
        const template = owner && owner._getItemTemplate(indexPath.row);
        let cell =
            collectionView.dequeueReusableCellWithReuseIdentifierForIndexPath(
                template.key,
                indexPath
            ) || FancyListViewCell.new();

        if (owner) {
            owner._prepareCell(<FancyListViewCell>cell, indexPath);
            const cellView: any = (cell as FancyListViewCell).view;
            let width;
            let height;

            if (cellView && cellView.isLayoutRequired) {
                if (owner._measuredMap && owner._measuredMap.has(indexPath.row)) {
                    const size = owner._measuredMap.get(indexPath.row);
                    width = layout.toDevicePixels(size.width);
                    height = layout.toDevicePixels(size.height);
                } else {
                    width =
                        owner.layoutType === 'grid' || owner.layoutType === 'staggered'
                            ? owner._effectiveItemWidth / owner.spanCount
                            : owner._effectiveItemWidth;
                    height = owner._effectiveItemHeight;
                }
                View.layoutChild(owner, cellView, 0, 0, width, height);
            }
        }

        return cell;
    }

    public collectionViewMoveItemAtIndexPathToIndexPath(collectionView: UICollectionView,
                                                        sourceIndexPath: NSIndexPath,
                                                        destinationIndexPath: NSIndexPath): void {
    }

    public collectionViewNumberOfItemsInSection(collectionView: UICollectionView,
                                                section: number): number {
        const owner = this._owner && this._owner.get();
        return owner && owner.items ? owner.items.length : 0;
    }

    public numberOfSectionsInCollectionView(collectionView: UICollectionView): number {
        return 1;
    }
}

class UICollectionViewFlowGridLayoutImpl extends UICollectionViewFlowLayout {
    _owner: WeakRef<FancyListView>;
    contentHeight: number = 0;
    cache: Array<UICollectionViewLayoutAttributes> = [];
    get contentWidth() {
        const owner = this._owner ? this._owner.get() : null;
        if (!owner) return 0;
        return layout.toDeviceIndependentPixels(owner._innerWidth);
    }

    get collectionViewContentSize(): CGSize {
        return CGSizeMake(this.contentWidth, this.contentHeight);
    }

    public static initWithOwner(owner: WeakRef<FancyListView>): UICollectionViewFlowGridLayoutImpl {
        const layout = UICollectionViewFlowGridLayoutImpl.new() as any;
        layout._owner = owner;
        return layout;
    }

    public prepareLayout(): void {
        const owner = this._owner ? this._owner.get() : null;
        if (!owner) {
            super.prepareLayout();
            return;
        }
        const delegate = owner._delegate as UICollectionDelegateImpl;
        this.cache = [];
        let xOffset = [];
        let yOffset = [];
        for (let i = 0; i < owner.spanCount; i++) {
            xOffset.push(
                i *
                layout.toDeviceIndependentPixels(
                    owner._effectiveItemWidth / owner.spanCount
                )
            );
        }
        let column = 0;
        const count = owner.items ? owner.items.length : 0;
        yOffset.length = count;
        yOffset.fill(0);
        for (let i = 0; i < count; i++) {
            let indexPath = NSIndexPath.indexPathForItemInSection(i, 0);
            let size = delegate.collectionViewLayoutSizeForItemAtIndexPath(
                this.collectionView,
                this,
                indexPath
            );
            let attributes = UICollectionViewLayoutAttributes.layoutAttributesForCellWithIndexPath(
                indexPath
            );
            let frame = CGRectMake(
                xOffset[column],
                yOffset[column],
                size.width,
                size.height
            );
            let insetFrame = CGRectInset(frame, 0, 0); // frame.insetBy(dx: cellPadding, dy: cellPadding)
            attributes.frame = insetFrame;
            this.cache.push(attributes);
            this.contentHeight = Math.max(
                this.contentHeight ? this.contentHeight : 0,
                CGRectGetMaxY(frame)
            );
            yOffset[column] = yOffset[column] + size.height;
            column = column < owner.spanCount - 1 ? column + 1 : 0;
        }
    }

    public invalidateLayout(): void {
        this.cache = [];
        this.contentHeight = 0;
        super.invalidateLayout();
    }

    public layoutAttributesForElementsInRect(rect: CGRect) {
        const owner = this._owner ? this._owner.get() : null;
        if (owner) {
            owner._visibleRect = rect;
        }
        let visibleLayoutAttributes = [];
        const len = this.cache && this.cache.length ? this.cache.length : 0;
        for (let i = 0; i < len; i++) {
            const attributes = this.cache[i];
            const frame: any =
                attributes && attributes.frame ? attributes.frame : null;
            if (CGRectIntersectsRect(rect, frame)) {
                visibleLayoutAttributes.push(attributes);
            }
        }
        return <any>visibleLayoutAttributes;
    }

    public layoutAttributesForItemAtIndexPath(indexPath: NSIndexPath): UICollectionViewLayoutAttributes {
        return this.cache[indexPath.row];
    }

    public shouldInvalidateLayoutForBoundsChange(): boolean {
        return true
    }
}

class UICollectionViewFlowStaggeredLayoutImpl extends UICollectionViewFlowLayout {
    _owner: WeakRef<FancyListView>;
    contentHeight: number = 0;
    cache: Array<UICollectionViewLayoutAttributes> = [];

    get contentWidth() {
        const owner = this._owner ? this._owner.get() : null;
        if (!owner) return 0;
        return layout.toDeviceIndependentPixels(owner._innerWidth);
    }

    get collectionViewContentSize(): CGSize {
        return CGSizeMake(this.contentWidth, this.contentHeight);
    }

    public static initWithOwner(owner: WeakRef<FancyListView>): UICollectionViewFlowStaggeredLayoutImpl {
        const layout = UICollectionViewFlowStaggeredLayoutImpl.new() as any;
        layout._owner = owner;
        return layout;
    }

    public prepareLayout() {
        const owner = this._owner ? this._owner.get() : null;
        if (!owner) return;
        const delegate = owner._delegate as UICollectionDelegateImpl;
        this.cache = [];
        let xOffset = [];
        let yOffset = [];
        for (let i = 0; i < owner.spanCount; i++) {
            xOffset.push(
                i *
                layout.toDeviceIndependentPixels(
                    owner._effectiveItemWidth / owner.spanCount
                )
            );
        }
        let column = 0;
        const count = this.collectionView.numberOfItemsInSection(0);
        yOffset.length = count;
        yOffset.fill(0);
        for (let i = 0; i < count; i++) {
            let indexPath = NSIndexPath.indexPathForItemInSection(i, 0);
            let size = delegate.collectionViewLayoutSizeForItemAtIndexPath(
                this.collectionView,
                this,
                indexPath
            );
            let attributes = UICollectionViewLayoutAttributes.layoutAttributesForCellWithIndexPath(
                indexPath
            );
            let frame = CGRectMake(
                xOffset[column],
                yOffset[column],
                size.width,
                size.height
            );
            let insetFrame = CGRectInset(frame, 0, 0); // frame.insetBy(dx: cellPadding, dy: cellPadding)
            attributes.frame = insetFrame;
            this.cache.push(attributes);
            this.contentHeight = Math.max(
                this.contentHeight ? this.contentHeight : 0,
                CGRectGetMaxY(frame)
            );
            yOffset[column] = yOffset[column] + size.height;
            column = column < owner.spanCount - 1 ? column + 1 : 0;
        }
    }

    public invalidateLayout(): void {
        this.cache = [];
        this.contentHeight = 0;
        super.invalidateLayout();
    }

    public shouldInvalidateLayoutForBoundsChange(): boolean {
        return true
    }

    public layoutAttributesForElementsInRect(rect: CGRect) {
        let visibleLayoutAttributes = [];
        const len = this.cache && this.cache.length ? this.cache.length : 0;
        for (let i = 0; i < len; i++) {
            const attributes = this.cache[i];
            const frame: any =
                attributes && attributes.frame ? attributes.frame : null;
            if (CGRectIntersectsRect(rect, frame)) {
                visibleLayoutAttributes.push(attributes);
            }
        }
        return <any>visibleLayoutAttributes;
    }

    public layoutAttributesForItemAtIndexPath(indexPath: NSIndexPath): UICollectionViewLayoutAttributes {
        return this.cache[indexPath.row];
    }
}

class UICollectionViewFlowLinearLayoutImpl extends UICollectionViewFlowLayout {
    _owner: WeakRef<FancyListView>;
    cache: Array<UICollectionViewLayoutAttributes> = [];
    private contentHeight = 0;

    get collectionViewContentSize(): CGSize {
        return CGSizeMake(this.contentWidth, this.contentHeight);
    }

    private get contentWidth() {
        const owner = this._owner ? this._owner.get() : null;
        if (!owner) return 0;
        return layout.toDeviceIndependentPixels(owner._innerWidth);
    }

    public static initWithOwner(owner: WeakRef<FancyListView>): UICollectionViewFlowLinearLayoutImpl {
        const layout = UICollectionViewFlowLinearLayoutImpl.new() as any;
        layout._owner = owner;
        return layout;
    }

    public prepareLayout() {
        const owner = this._owner ? this._owner.get() : null;
        if (!owner) return;
        const delegate = owner._delegate as UICollectionDelegateImpl;
        this.cache = [];
        let xOffset = [];
        let yOffset = [];
        let column = 1;
        const count = this.collectionView.numberOfItemsInSection(0);
        yOffset.length = count;
        yOffset.fill(0);
        for (let i = 0; i < count; i++) {
            let indexPath = NSIndexPath.indexPathForItemInSection(i, 0);
            let size = delegate.collectionViewLayoutSizeForItemAtIndexPath(
                this.collectionView,
                this,
                indexPath
            );
            let attributes = UICollectionViewLayoutAttributes.layoutAttributesForCellWithIndexPath(
                indexPath
            );
            let frame = CGRectMake(0, yOffset[column], size.width, size.height);
            let insetFrame = CGRectInset(frame, 0, 0); // frame.insetBy(dx: cellPadding, dy: cellPadding)
            attributes.frame = insetFrame;
            this.cache.push(attributes);
            this.contentHeight = Math.max(
                this.contentHeight ? this.contentHeight : 0,
                CGRectGetMaxY(frame)
            );
            yOffset[column] = yOffset[column] + size.height;
        }
    }

    public invalidateLayout(): void {
        this.cache = [];
        this.contentHeight = 0;
        super.invalidateLayout();
    }

    public shouldInvalidateLayoutForBoundsChange(): boolean {
        return true
    }

    public layoutAttributesForElementsInRect(rect: CGRect) {
        let visibleLayoutAttributes = [];
        const len = this.cache && this.cache.length ? this.cache.length : 0;
        for (let i = 0; i < len; i++) {
            const attributes = this.cache[i];
            const frame: any =
                attributes && attributes.frame ? attributes.frame : null;
            if (CGRectIntersectsRect(rect, frame)) {
                visibleLayoutAttributes.push(attributes);
            }
        }
        return <any>visibleLayoutAttributes;
    }

    public layoutAttributesForItemAtIndexPath(indexPath: NSIndexPath): UICollectionViewLayoutAttributes {
        return this.cache[indexPath.row];
    }
}
