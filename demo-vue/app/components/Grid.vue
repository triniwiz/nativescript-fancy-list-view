<template>
<Page>
    <FancyListView for="item in items" orientation="horizontal" itemHeight="50%" layoutType="grid" spanCount="3" hideScrollBar="true">
        <v-template>
            <GridLayout rows="auto,*">
                <Label :text="item.title" class="t-20 text-center c-black" textWrap="true"/>
                <ImageCacheIt resize="300,300" stretch="fill" row="1" :imageUri="item.image"></ImageCacheIt>
            </GridLayout>
        </v-template>
    </FancyListView>
</Page>
</template>
<script>
import data from '../data';
export default{
    name: 'grid',
    data() {
			return {
				items: data.items
			}
		}
}
</script>
