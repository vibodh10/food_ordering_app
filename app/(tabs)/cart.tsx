import {View, Text, FlatList} from 'react-native'
import {SafeAreaView} from "react-native-safe-area-context";
import {useCartStore} from "@/store/cart.store";
import CustomHeader from "@/components/CustomHeader";
import {PaymentInfoStripeProps} from "@/type";
import cn from "clsx";
import CartItem from "@/components/CartItem";
import {StripeProvider} from "@stripe/stripe-react-native";
import Payment from "@/components/Payment";
import {useAuthStore} from "@/store/auth.store";

const PaymentInfoStripe = ({
   label,
   value,
   labelStyle,
   valueStyle,
}: PaymentInfoStripeProps) => (
    <View className="flex-between flex-row my-1">
        <Text className={cn("paragraph-medium text-gray-200", labelStyle)}>
            {label}
        </Text>
        <Text className={cn("paragraph-bold text-dark-100", valueStyle)}>
            {value}
        </Text>
    </View>
);

const Cart = () => {
    const { items, getTotalItems, getTotalPrice } = useCartStore();

    const totalItems = getTotalItems();
    const totalPrice = getTotalPrice();
    const { user } = useAuthStore();

    console.log(items[0].price);

    return (
        <StripeProvider
            publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
            merchantIdentifier="merchant.fast_food.com"
            urlScheme="fastfood"
        >
            <SafeAreaView className="bg-white h-full">
                <FlatList
                    data={items}
                    renderItem={({ item }) => <CartItem item={item} />}
                    keyExtractor={(item) => item.id}
                    contentContainerClassName="pb-28 px-5 pt-5"
                    ListHeaderComponent={() => <CustomHeader title="Your Cart" />}
                    ListEmptyComponent={() => <Text>Cart Empty</Text>}
                    ListFooterComponent={() => totalItems > 0 && (
                        <View className="gap-5">
                            <View className="mt-6 border border-gray-200 p-5 rounded-2xl">
                                <Text className="h3-bold text-dark-100 mb-5">
                                    Payment Summary
                                </Text>

                                <PaymentInfoStripe
                                    label={`Total Items (${totalItems})`}
                                    value={`£${totalPrice.toFixed(2)}`}
                                />
                                <PaymentInfoStripe
                                    label={`Delivery Fee`}
                                    value={`£5.00`}
                                />
                                <PaymentInfoStripe
                                    label={`Discount`}
                                    value={`-£0.50`}
                                    valueStyle="!text-success"
                                />
                                <View className="border-t border-gray-300 my-2" />
                                <PaymentInfoStripe
                                    label={`Total`}
                                    value={`£${(totalPrice + 5 - 0.5).toFixed(2)}`}
                                    labelStyle="base-bold !text-dark-100"
                                    valueStyle="base-bold !text-dark-100 !text-right"
                                />
                            </View>

                            <Payment
                                fullName={user?.name}
                                email={user?.email}
                                items={items}
                                menuItem={items[0]}
                                amount={totalPrice}
                            />
                        </View>
                    )}
                />
            </SafeAreaView>
        </StripeProvider>

    )
}
export default Cart
