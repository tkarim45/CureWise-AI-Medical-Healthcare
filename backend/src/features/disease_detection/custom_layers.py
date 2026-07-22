"""Custom Keras layers required to deserialize the breast-cancer segmentation model."""

from tensorflow.keras.layers import (
    Add,
    BatchNormalization,
    Conv2D,
    Dropout,
    Layer,
    MaxPool2D,
    Multiply,
    UpSampling2D,
    concatenate,
)


class EncoderBlock(Layer):
    def __init__(self, filters, rate, pooling=True, **kwargs):
        super().__init__(**kwargs)
        self.filters = filters
        self.rate = rate
        self.pooling = pooling
        self.c1 = Conv2D(filters, 3, 1, padding="same", activation="relu",
                         kernel_initializer="he_normal")
        self.drop = Dropout(rate)
        self.c2 = Conv2D(filters, 3, 1, padding="same", activation="relu",
                         kernel_initializer="he_normal")
        self.pool = MaxPool2D()

    def call(self, X):
        x = self.c1(X)
        x = self.drop(x)
        x = self.c2(x)
        if self.pooling:
            return self.pool(x), x
        return x

    def get_config(self):
        return {**super().get_config(), "filters": self.filters,
                "rate": self.rate, "pooling": self.pooling}


class DecoderBlock(Layer):
    def __init__(self, filters, rate, **kwargs):
        super().__init__(**kwargs)
        self.filters = filters
        self.rate = rate
        self.up = UpSampling2D()
        self.net = EncoderBlock(filters, rate, pooling=False)

    def call(self, X):
        X, skip_X = X
        x = self.up(X)
        c_ = concatenate([x, skip_X])
        return self.net(c_)

    def get_config(self):
        return {**super().get_config(), "filters": self.filters, "rate": self.rate}


class AttentionGate(Layer):
    def __init__(self, filters, bn, **kwargs):
        super().__init__(**kwargs)
        self.filters = filters
        self.bn = bn
        self.normal = Conv2D(filters, 3, padding="same", activation="relu",
                             kernel_initializer="he_normal")
        self.down = Conv2D(filters, 3, strides=2, padding="same", activation="relu",
                           kernel_initializer="he_normal")
        self.learn = Conv2D(1, 1, padding="same", activation="sigmoid")
        self.resample = UpSampling2D()
        self.BN = BatchNormalization()

    def call(self, X):
        X, skip_X = X
        x = self.normal(X)
        skip = self.down(skip_X)
        x = Add()([x, skip])
        x = self.learn(x)
        x = self.resample(x)
        f = Multiply()([x, skip_X])
        return self.BN(f) if self.bn else f

    def get_config(self):
        return {**super().get_config(), "filters": self.filters, "bn": self.bn}
