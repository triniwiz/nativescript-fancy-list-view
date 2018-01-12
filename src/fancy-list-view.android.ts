import {
  FancyListViewBase,
  ItemEventData,
  ITEMLOADING,
  itemTemplatesProperty,
  layoutTypeProperty,
  LAYOUT_TYPE,
  spanCountProperty,
  itemWidthProperty,
  itemHeightProperty,
  orientationProperty,
  Orientation
} from './fancy-list-view.common';
import { View, KeyedTemplate, layout } from 'tns-core-modules/ui/core/view';
import { LayoutBase } from 'tns-core-modules/ui/layouts/layout-base';
import { StackLayout } from 'tns-core-modules/ui/layouts/stack-layout';
import { ProxyViewContainer } from 'tns-core-modules/ui/proxy-view-container';
import { Observable } from 'tns-core-modules/data/observable/observable';
import { screen } from 'tns-core-modules/platform';
import * as common from './fancy-list-view.common';
import { isNumber } from 'tns-core-modules/utils/types';
global.moduleMerge(common, exports);

export class FancyRecyclerView extends android.support.v7.widget.RecyclerView {
  constructor(
    context: android.content.Context,
    private owner: WeakRef<FancyListView>
  ) {
    super(context);

    return global.__native(this);
  }

  public onLayout(
    changed: boolean,
    l: number,
    t: number,
    r: number,
    b: number
  ) {
    if (changed) {
      const owner = this.owner.get();
      owner.onLayout(l, t, r, b);
    }
    super.onLayout(changed, l, t, r, b);
  }
}

export class FancyListView extends FancyListViewBase {
  nativeViewProtected: android.support.v7.widget.RecyclerView;
  private _androidViewId: number = -1;
  public _realizedItems = new Map<android.view.View, View>();
  _random: any;
  public createNativeView() {
    this._random = new java.util.Random();
    const fancyList = new FancyRecyclerView(this._context, new WeakRef(this));
    ensureFancyListViewAdapterClass();
    const adapter = new FancyListViewAdapterClass(new WeakRef(this));
    adapter.setHasStableIds(true);
    fancyList.setAdapter(adapter);
    (<any>fancyList).adapter = adapter;
    const lm = new android.support.v7.widget.LinearLayoutManager(this._context);
    lm.setOrientation(android.support.v7.widget.LinearLayoutManager.VERTICAL);
    fancyList.setLayoutManager(lm);
    return fancyList;
  }

  public initNativeView() {
    super.initNativeView();
    const nativeView = this.nativeViewProtected;
    const adapter = (<any>nativeView).adapter;
    adapter.owner = new WeakRef(this);
    nativeView.setAdapter(adapter);
    if (this.layoutType) {
      //  this.setLayoutType(this.layoutType);
    }

    if (this.spanCount) {
      //   this.setSpanCount(this.spanCount);
    }
    itemWidthProperty.coerce(this);
    itemHeightProperty.coerce(this);
  }

  public [orientationProperty.getDefault](): Orientation {
    const layoutManager = this.nativeViewProtected.getLayoutManager() as any;
    if (
      layoutManager.getOrientation() ===
      android.support.v7.widget.LinearLayoutManager.HORIZONTAL
    ) {
      return 'horizontal';
    }

    return 'vertical';
  }

  public [orientationProperty.setNative](value: Orientation) {
    const layoutManager = this.nativeView.getLayoutManager() as any;
    if (value === 'horizontal') {
      let hm;
      switch (layoutManager) {
        case android.support.v7.widget.GridLayoutManager:
          hm = android.support.v7.widget.GridLayoutManager.HORIZONTAL;
          break;
        case android.support.v7.widget.StaggeredGridLayoutManager:
          hm = android.support.v7.widget.StaggeredGridLayoutManager.HORIZONTAL;
          break;
        default:
          hm = android.support.v7.widget.LinearLayoutManager.HORIZONTAL;
          break;
      }
      layoutManager.setOrientation(hm);
    } else {
      let vm;
      switch (layoutManager) {
        case android.support.v7.widget.GridLayoutManager:
          vm = android.support.v7.widget.GridLayoutManager.VERTICAL;
          break;
        case android.support.v7.widget.StaggeredGridLayoutManager:
          vm = android.support.v7.widget.StaggeredGridLayoutManager.VERTICAL;
          break;
        default:
          vm = android.support.v7.widget.LinearLayoutManager.VERTICAL;
          break;
      }
      layoutManager.setOrientation(vm);
    }
  }

  public disposeNativeView() {
    const nativeView = this.nativeViewProtected;
    nativeView.setAdapter(null);
    // (<any>nativeView).itemClickListener.owner = null;
    (<any>nativeView).adapter.owner = null;
    this.clearRealizedCells();
    super.disposeNativeView();
  }

  public onLayout(left: number, top: number, right: number, bottom: number) {
    super.onLayout(left, top, right, bottom);
    this.refresh();
  }

  public refresh(): void {
    const nativeView = this.nativeViewProtected;
    if (!nativeView || !nativeView.getAdapter()) {
      return;
    }

    // clear bindingContext when it is not observable because otherwise bindings to items won't reevaluate
    this._realizedItems.forEach((view, nativeView) => {
      if (!(view.bindingContext instanceof Observable)) {
        view.bindingContext = null;
      }
    });
    this.setLayoutType(this.layoutType);
    this.setSpanCount(this.spanCount);
    nativeView.getAdapter().notifyDataSetChanged();
  }

  [itemTemplatesProperty.getDefault](): KeyedTemplate[] {
    return null;
  }
  [itemTemplatesProperty.setNative](value: KeyedTemplate[]) {
    this._itemTemplatesInternal = new Array<KeyedTemplate>(
      this._defaultTemplate
    );
    if (value) {
      this._itemTemplatesInternal = this._itemTemplatesInternal.concat(value);
    }
    this.nativeViewProtected.setAdapter(
      new FancyListViewAdapterClass(new WeakRef(this))
    );
    this.refresh();
  }
  [spanCountProperty.setNative](spanCount: number) {
    // this.setSpanCount(spanCount);
    this.refresh();
  }
  [layoutTypeProperty.setNative](type: string) {
    // this.setLayoutType(type);
    this.refresh();
  }
  private setSpanCount(count: number) {
    const nativeView = this.nativeViewProtected;
    if (nativeView && this._effectiveItemWidth && this._innerWidth) {
      const lm = nativeView.getLayoutManager();
      if (
        lm instanceof android.support.v7.widget.GridLayoutManager ||
        lm instanceof android.support.v7.widget.StaggeredGridLayoutManager
      ) {
        lm.setSpanCount(count);
      }
    }
  }
  private setLayoutType(type: string) {
    const nativeView = this.nativeViewProtected;
    if (nativeView) {
      switch (type) {
        case LAYOUT_TYPE.GRID:
          nativeView.setLayoutManager(
            new android.support.v7.widget.GridLayoutManager(
              this._context,
              <any>new java.lang.Integer(this.spanCount)
            )
          );
          break;
        case LAYOUT_TYPE.STAGGERED:
          nativeView.setLayoutManager(
            new android.support.v7.widget.StaggeredGridLayoutManager(
              2,
              android.support.v7.widget.RecyclerView.VERTICAL
            )
          );
          break;
        default:
          nativeView.setLayoutManager(
            new android.support.v7.widget.LinearLayoutManager(this._context)
          );
          break;
      }
    }
  }

  public eachChildView(callback: (child: View) => boolean): void {
    this._realizedItems.forEach((view, nativeView) => {
      if (view.parent instanceof FancyListView) {
        callback(view);
      } else {
        // in some cases (like item is unloaded from another place (like angular) view.parent becomes undefined)
        if (view.parent) {
          callback(<View>view.parent);
        }
      }
    });
  }

  private clearRealizedCells(): void {
    // clear the cache
    this._realizedItems.forEach((view, nativeView) => {
      if (view.parent) {
        // This is to clear the StackLayout that is used to wrap non LayoutBase & ProxyViewContainer instances.
        if (!(view.parent instanceof FancyListView)) {
          this._removeView(view.parent);
        }
        view.parent._removeView(view);
      }
    });

    this._realizedItems.clear();
  }
}

class FancyListViewHolder extends android.support.v7.widget.RecyclerView
  .ViewHolder {
  constructor(
    private owner: WeakRef<View>,
    private list: WeakRef<FancyListView>
  ) {
    super(owner.get().nativeViewProtected);
    return global.__native(this);
  }
  get view(): View {
    return this.owner ? this.owner.get() : null;
  }
}

let FancyListViewAdapterClass;
function ensureFancyListViewAdapterClass() {
  if (FancyListViewAdapterClass) {
    return;
  }

  class FancyListViewAdapter extends android.support.v7.widget.RecyclerView
    .Adapter {
    owner: WeakRef<FancyListView>;
    constructor(owner: WeakRef<FancyListView>) {
      super();
      this.owner = owner;
      return global.__native(this);
    }
    public onCreateViewHolder(parent: android.view.ViewGroup, index: number) {
      const owner = this.owner ? this.owner.get() : null;
      if (!owner) {
        return null;
      }
      const template = owner._getItemTemplate(index);
      let view: View = template.createView();
      if (!view) {
        view = owner._getDefaultItemContent(index);
      }
      if (view instanceof View && !(view instanceof ProxyViewContainer)) {
        owner._addView(view);
      } else {
        let sp = new StackLayout();
        sp.addChild(view);
        owner._addView(sp);
      }

      owner._realizedItems.set(view.nativeView, view);

      const holder = new FancyListViewHolder(
        new WeakRef(view),
        new WeakRef(owner)
      );
      return holder;
    }
    public onBindViewHolder(holder: FancyListViewHolder, index: number) {
      const owner = this.owner ? this.owner.get() : null;
      if (owner) {
        let args = <ItemEventData>{
          eventName: ITEMLOADING,
          object: owner,
          android: holder,
          ios: undefined,
          index: index,
          view: holder.view
        };

        if (owner.layoutType === LAYOUT_TYPE.STAGGERED) {
          const max = layout.toDeviceIndependentPixels(
            owner._effectiveItemHeight
          );
          const min =
            layout.toDeviceIndependentPixels(owner._effectiveItemHeight) *
            (1 / 3);
          if (min && max) {
            holder.view.height =
              (owner._random as java.util.Random).nextInt(max - min + min) +
              min;
          }
        } else {
          if (owner._itemHeight) {
            holder.view.height = layout.toDeviceIndependentPixels(owner._effectiveItemHeight);
          }

          if (owner._itemWidth) {
            holder.view.width = layout.toDeviceIndependentPixels(owner._effectiveItemWidth);
          }
        }

        owner._prepareItem(holder.view, index);
      }
    }
    public getItemId(i: number) {
      const owner = this.owner ? this.owner.get() : null;
      let id = i;
      if (owner && owner.items) {
        const item = owner.items[i];
        if (item) {
          id = owner.itemIdGenerator(item, i, owner.items);
        }
      }
      return long(id);
    }
    public getItemCount(): number {
      const owner = this.owner ? this.owner.get() : null;
      return owner && owner.items && owner.items.length
        ? owner.items.length
        : 0;
    }
    public getItemViewType(index: number) {
      const owner = this.owner ? this.owner.get() : null;
      let template = owner._getItemTemplate(index);
      let itemViewType = owner._itemTemplatesInternal.indexOf(template);
      return itemViewType;
    }
  }

  FancyListViewAdapterClass = FancyListViewAdapter;
}
