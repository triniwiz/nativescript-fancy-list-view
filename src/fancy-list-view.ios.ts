import {
  FancyListViewBase,
  orientationProperty,
  Orientation,
  ItemEventData,
  ITEMLOADING,
  itemTemplatesProperty,
  layoutTypeProperty,
  LAYOUT_TYPE,
  spanCountProperty,
  paddingTopProperty,
  paddingRightProperty,
  paddingBottomProperty,
  paddingLeftProperty,
  itemHeightProperty,
  itemWidthProperty,
  hideScrollBarProperty,
  ITEMTAP,
  LOADMOREITEMS,
  EventData
} from './fancy-list-view.common';
import {
  View,
  layout,
  Observable,
  KeyedTemplate,
  PercentLength,
  Length
} from 'tns-core-modules/ui/core/view';
import { profile } from 'tns-core-modules/profiling';
import * as common from './fancy-list-view.common';
import { ProxyViewContainer } from 'tns-core-modules/ui/proxy-view-container';
import { StackLayout } from 'tns-core-modules/ui/layouts/stack-layout';
import { screen } from 'tns-core-modules/platform/platform';
global.moduleMerge(common, exports);

export class FancyListView extends FancyListViewBase {
  heightMeasureSpec: number;
  _ios: UICollectionView;
  _isDataDirty: any;
  widthMeasureSpec: number;
  _preparingCell: boolean;
  nativeViewProtected: UICollectionView;
  _layout: any;
  private _delegate;
  private _dataSource;
  private _map: Map<FancyListViewCell, View>;
  public _staggeredMap: Map<number, CGSize>;
  constructor() {
    super();
    this._layout = UICollectionViewFlowLayout.new();
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
    this._staggeredMap = new Map<number, CGSize>();
    this._setNativeClipToBounds();
  }

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

  public _removeContainer(cell: FancyListViewCell): void {
    let view = cell.view;
    // This is to clear the StackLayout that is used to wrap ProxyViewContainer instances.
    if (!(view.parent instanceof FancyListView)) {
      this._removeView(view.parent);
    }

    view.parent._removeView(view);
    this._map.delete(cell);
  }

  private setSpanCount(count: number) {
    const nativeView = this.nativeViewProtected;
    this.setLayoutType(this.layoutType);
  }
  private setLayoutType(type: string) {
    const nativeView = this.nativeViewProtected;
    if (nativeView && this._innerWidth && this.spanCount) {
      let width;
      let height;
      switch (type) {
        case LAYOUT_TYPE.GRID:
          width = this._innerWidth / this.spanCount;
          break;
        case LAYOUT_TYPE.STAGGERED:
          width = this._innerWidth / this.spanCount;
          break;
        default:
          width = this._effectiveItemWidth;
          height = this._effectiveItemHeight;
          break;
      }
      this.customLayout(width, height);
    }
  }

  [layoutTypeProperty.setNative](type: LAYOUT_TYPE) {
    this.setLayoutType(type);
  }

  [spanCountProperty.setNative](count: number) {
    this.setSpanCount(count);
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
  private customLayout(
    width = this._effectiveItemWidth,
    height = this._effectiveItemHeight
  ) {
    const _layout = this._ios
      .collectionViewLayout as UICollectionViewFlowLayout;
    _layout.itemSize = CGSizeMake(
      layout.toDeviceIndependentPixels(width),
      layout.toDeviceIndependentPixels(height)
    );

    this.requestLayout();
  }

  public [hideScrollBarProperty.setNative](hide: boolean) {
    switch (this.orientation) {
      case 'horizontal':
        this._ios.showsHorizontalScrollIndicator = hide ? false : true;
        break;
      default:
        this._ios.showsVerticalScrollIndicator = hide ? false : true;
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
    this._map.forEach((view, nativeView, map) => {
      if (!(view.bindingContext instanceof Observable)) {
        view.bindingContext = null;
      }
    });
    if (this.isLoaded) {
      this._ios.reloadData();
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
        this._removeContainer(cell);
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

  private _layoutCell(cellView: View, index: NSIndexPath) {
    if (cellView) {
      let width = this._effectiveItemWidth;
      let height = this._effectiveItemHeight;
      if (this.layoutType === 'grid' || this.layoutType === 'staggered') {
        width = width / this.spanCount;
        // height = height / this.spanCount;
      }

      // if (this.layoutType === 'staggered') {
      //   const max =
      //     layout.toDeviceIndependentPixels(
      //       PercentLength.toDevicePixels(this.max)
      //     ) || layout.toDeviceIndependentPixels(height) * 2;
      //   const min =
      //     layout.toDeviceIndependentPixels(
      //       PercentLength.toDevicePixels(this.min)
      //     ) || layout.toDeviceIndependentPixels(height * 2) * (1 / 3);
      //   height = Math.floor(Math.random() * (max - min + 1) + min);
      // }

      const widthMeasureSpec = layout.makeMeasureSpec(width, layout.EXACTLY);

      const heightMeasureSpec = layout.makeMeasureSpec(height, layout.EXACTLY);

      const m = View.measureChild(
        this,
        cellView,
        widthMeasureSpec,
        heightMeasureSpec
      );
    }
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
}

export class FancyListViewCell extends UICollectionViewCell {
  public willMoveToSuperview(newSuperview: UIView): void {
    let parent = <FancyListView>(this.view ? this.view.parent : null);

    // When inside ListView and there is no newSuperview this cell is
    // removed from native visual tree so we remove it from our tree too.
    if (parent && !newSuperview) {
      parent._removeContainer(this);
    }
  }

  public get view(): View {
    return this.owner ? this.owner.get() : null;
  }

  public owner: WeakRef<View>;
}

@ObjCClass(UICollectionViewDelegate, UICollectionViewDelegateFlowLayout)
class UICollectionDelegateImpl extends NSObject
  implements UICollectionViewDelegate, UICollectionViewDelegateFlowLayout {
  private _owner: WeakRef<FancyListView>;
  public static initWithOwner(
    owner: WeakRef<FancyListView>
  ): UICollectionDelegateImpl {
    const delegate = UICollectionDelegateImpl.new() as UICollectionDelegateImpl;
    delegate._owner = owner;
    return delegate;
  }

  collectionViewLayoutSizeForItemAtIndexPath(
    collectionView: UICollectionView,
    collectionViewLayout: UICollectionViewLayout,
    indexPath: NSIndexPath
  ): CGSize {
    const owner = this._owner.get();
    if (owner.layoutType === 'staggered') {
      const max =
        layout.toDeviceIndependentPixels(
          PercentLength.toDevicePixels(owner.max)
        ) || layout.toDeviceIndependentPixels(owner._effectiveItemHeight) * 2;
      const min =
        layout.toDeviceIndependentPixels(
          PercentLength.toDevicePixels(owner.min)
        ) ||
        layout.toDeviceIndependentPixels(owner._effectiveItemHeight * 2) *
          (1 / 3);
      const size = CGSizeMake(
        layout.toDeviceIndependentPixels(
          owner._effectiveItemWidth / owner.spanCount
        ),
        Math.floor(Math.random() * (max - min + 1) + min)
      );
      if (owner._staggeredMap && owner._staggeredMap.has(indexPath.row)) {
        return owner._staggeredMap.get(indexPath.row);
      } else {
        owner._staggeredMap.set(indexPath.row, size);
      }
      return size;
    }else{
      return CGSizeMake(layout.toDeviceIndependentPixels(owner.layoutType === 'grid' ? owner._effectiveItemWidth / owner.spanCount : owner._effectiveItemWidth), layout.toDeviceIndependentPixels(owner._effectiveItemHeight));
    }
  }

  public collectionViewWillDisplayCellForItemAtIndexPath(
    collectionView: UICollectionView,
    cell: UICollectionViewCell,
    indexPath: NSIndexPath
  ) {
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

  public collectionViewDidSelectItemAtIndexPath(
    collectionView: UICollectionView,
    indexPath: NSIndexPath
  ) {
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
  public static initWithOwner(
    owner: WeakRef<FancyListView>
  ): UICollectionViewDataSourceImpl {
    const delegate = UICollectionViewDataSourceImpl.new() as UICollectionViewDataSourceImpl;
    delegate._owner = owner;
    return delegate;
  }

  collectionViewCanMoveItemAtIndexPath?(
    collectionView: UICollectionView,
    indexPath: NSIndexPath
  ): boolean {
    return true;
  }

  collectionViewCellForItemAtIndexPath(
    collectionView: UICollectionView,
    indexPath: NSIndexPath
  ): UICollectionViewCell {
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
      cell.systemLayoutSizeFittingSize(owner._staggeredMap.get(indexPath.row));
      if (cellView && cellView.isLayoutRequired) {
        View.layoutChild(
          owner,
          cellView,
          0,
          0,
          owner.layoutType === 'grid' || owner.layoutType === 'staggered'
            ? owner._effectiveItemWidth / owner.spanCount
            : owner._effectiveItemWidth,
          owner._effectiveItemHeight
        );
      }
    }

    return cell;
  }

  collectionViewMoveItemAtIndexPathToIndexPath(
    collectionView: UICollectionView,
    sourceIndexPath: NSIndexPath,
    destinationIndexPath: NSIndexPath
  ): void {}
  collectionViewNumberOfItemsInSection(
    collectionView: UICollectionView,
    section: number
  ): number {
    const owner = this._owner && this._owner.get();
    return owner && owner.items ? owner.items.length : 0;
  }
  numberOfSectionsInCollectionView(collectionView: UICollectionView): number {
    return 1;
  }
}
