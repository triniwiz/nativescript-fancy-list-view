<template>
<Page>
    <FancyListView orientation="vertical" backgroundColor="red" for="item in items" itemWidth="100%" layoutType="staggered" spanCount="3" hideScrollBar="true">
        <v-template>
            <GridLayout margin="40%" backgroundColor="blue" rows="auto,*" borderWidth="1" borderColor="gray" borderRadius="10">
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
    name: 'stagger',
    data() {
			return {
				items: data.items
			}
		}
}
</script>
