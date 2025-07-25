import React, { useState } from 'react';
import CustomButton from '@/components/CustomButton';
import { useStripe } from '@stripe/stripe-react-native';
import { Alert, Image, Text, View } from 'react-native';
import { fetchAPI } from '@/lib/fetch';
import { createOrders } from '@/lib/appwrite';
import { images } from '@/constants';
import { ReactNativeModal } from 'react-native-modal';
import { router } from 'expo-router';

type PaymentProps = {
    fullName: string;
    email: string;
    amount: number;
    items: number;
    menuItem: string;
};

const Payment = ({
    fullName,
    email,
    amount,
    items,
    menuItem,
}: PaymentProps) => {
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const [success, setSuccess] = useState(false);

    const initializePaymentSheet = async () => {
        try {
            const response = await fetchAPI('/api/stripe/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: fullName, email, amount }),
            });

            const { paymentIntent, ephemeralKey, customer } = response;

            const { error } = await initPaymentSheet({
                merchantDisplayName: 'Snacktastic',
                customerId: customer,
                customerEphemeralKeySecret: ephemeralKey.secret,
                paymentIntentClientSecret: paymentIntent.client_secret,
                allowsDelayedPaymentMethods: true,
            });

            if (error) {
                Alert.alert('Payment Sheet Error', error.message);
            }
        } catch (err: any) {
            Alert.alert('Setup Failed', err?.message || 'Something went wrong.');
        }
    };

    const openPaymentSheet = async () => {
        await initializePaymentSheet();

        const { error } = await presentPaymentSheet();

        if (error) {
            Alert.alert(`Payment Failed`, error.message);
        } else {
            setSuccess(true);
            await createOrders({ name: menuItem, totalPrice: amount, items });
        }
    };

    return (
        <>
            <CustomButton title="Order now" onPress={openPaymentSheet} />

            <ReactNativeModal isVisible={success} onBackdropPress={() => setSuccess(false)}>
                <View className="flex flex-col items-center justify-center bg-white p-7 rounded-2xl">
                    <Image source={images.check} className="w-28 h-28 mt-5" />
                    <Text className="text-2xl text-center h1-bold mt-5">
                        Your food has been ordered!
                    </Text>
                    <Text className="text-center mt-3 text-gray-200 body-medium">
                        Thank you for your order!
                    </Text>
                    <CustomButton
                        title="Back Home"
                        onPress={() => {
                            setSuccess(false);
                            router.push('/');
                        }}
                    />
                </View>
            </ReactNativeModal>
        </>
    );
};

export default Payment;
