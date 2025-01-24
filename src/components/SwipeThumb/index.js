import React, { useCallback, useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { I18nManager } from "react-native";
import { Animated, Image, PanResponder, View } from "react-native";

// Styles
import styles, { borderWidth, margin } from "./styles";

// Constants
import { TRANSPARENT_COLOR } from "../../constants";
const DEFAULT_ANIMATION_DURATION = 400;
const RESET_AFTER_SUCCESS_DEFAULT_DELAY = 1000;

const SwipeThumb = (props) => {
  let {
    disabled = false,
    disableResetOnTap = false,
    disabledThumbIconBackgroundColor,
    disabledThumbIconBorderColor,
    enableReverseSwipe,
    finishRemainingSwipeAnimationDuration = 400,
    forceCompleteSwipe,
    forceReset,
    layoutWidth = 0,
    onSwipeFail,
    onSwipeStart,
    onSwipeSuccess,
    railFillBackgroundColor,
    railFillBorderColor,
    railStyles,
    resetAfterSuccessAnimDelay,
    shouldResetAfterSuccess,
    swipeSuccessThreshold,
    thumbIconBackgroundColor,
    thumbIconBorderColor,
    thumbIconComponent: ThumbIconComponent,
    thumbIconHeight,
    thumbIconImageSource,
    thumbIconStyles = {},
    thumbIconWidth,
  } = props;

  const paddingAndMarginsOffset = borderWidth + 2 * margin;
  var defaultContainerWidth = 0;
  if (thumbIconWidth == undefined) {
    defaultContainerWidth = thumbIconHeight;
  } else {
    defaultContainerWidth = thumbIconWidth;
  }
  const maxWidth = layoutWidth - paddingAndMarginsOffset;
  const isRTL = I18nManager.isRTL;

  const animatedWidth = useRef(
    new Animated.Value(defaultContainerWidth),
  ).current;
  const [defaultWidth, setDefaultWidth] = useState(defaultContainerWidth);
  const [shouldDisableTouch, disableTouch] = useState(false);

  const [backgroundColor, setBackgroundColor] = useState(TRANSPARENT_COLOR);
  const [borderColor, setBorderColor] = useState(TRANSPARENT_COLOR);

  const panResponder = useCallback(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onShouldBlockNativeResponder: () => true,
      onPanResponderStart,
      onPanResponderMove,
      onPanResponderRelease,
    }),
    [props],
  );

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: defaultWidth,
      duration: finishRemainingSwipeAnimationDuration,
      useNativeDriver: false,
    }).start();
  }, [animatedWidth, defaultWidth, finishRemainingSwipeAnimationDuration]);

  useEffect(() => {
    forceReset && forceReset(reset);
  }, [forceReset]);

  useEffect(() => {
    forceCompleteSwipe && forceCompleteSwipe(forceComplete);
  }, [forceCompleteSwipe]);

  function onSwipeNotMetSuccessThreshold() {
    // Animate to initial position
    setDefaultWidth(defaultContainerWidth);
    onSwipeFail && onSwipeFail();
  }

  function onSwipeMetSuccessThreshold(newWidth) {
    if (newWidth !== maxWidth) {
      finishRemainingSwipe();
      return;
    }
    invokeOnSwipeSuccess(false);
    reset();
  }

  function onPanResponderStart() {
    if (disabled) {
      return;
    }
    onSwipeStart && onSwipeStart();
  }

  async function onPanResponderMove(_, gestureState) {
    if (disabled) {
      return;
    }
    const reverseMultiplier = enableReverseSwipe ? -1 : 1;
    const rtlMultiplier = isRTL ? -1 : 1;
    const newWidth =
      defaultContainerWidth +
      rtlMultiplier * reverseMultiplier * gestureState.dx;
    if (newWidth < defaultContainerWidth) {
      // Reached starting position
      reset();
    } else if (newWidth > maxWidth) {
      // Reached end position
      setBackgroundColors();
      setDefaultWidth(maxWidth);
    } else {
      setBackgroundColors();
      await Animated.timing(animatedWidth, {
        toValue: newWidth,
        duration: 0,
        useNativeDriver: false,
      }).start();
      setDefaultWidth(newWidth);
    }
  }

  function onPanResponderRelease(_, gestureState) {
    if (disabled) {
      return;
    }
    const reverseMultiplier = enableReverseSwipe ? -1 : 1;
    const rtlMultiplier = isRTL ? -1 : 1;
    const newWidth =
      defaultContainerWidth +
      rtlMultiplier * reverseMultiplier * gestureState.dx;
    const successThresholdWidth = maxWidth * (swipeSuccessThreshold / 100);
    newWidth < successThresholdWidth
      ? onSwipeNotMetSuccessThreshold()
      : onSwipeMetSuccessThreshold(newWidth);
  }

  function setBackgroundColors() {
    setBackgroundColor(railFillBackgroundColor);
    setBorderColor(railFillBorderColor);
  }

  function finishRemainingSwipe() {
    // Animate to final position
    setDefaultWidth(maxWidth);
    invokeOnSwipeSuccess(false);

    //Animate back to initial position after successfully swiped
    const resetDelay =
      DEFAULT_ANIMATION_DURATION +
      (resetAfterSuccessAnimDelay !== undefined
        ? resetAfterSuccessAnimDelay
        : RESET_AFTER_SUCCESS_DEFAULT_DELAY);
    setTimeout(() => {
      shouldResetAfterSuccess && reset();
    }, resetDelay);
  }

  function invokeOnSwipeSuccess(forceComplete) {
    disableTouch(disableResetOnTap);
    onSwipeSuccess && onSwipeSuccess(forceComplete);
  }

  function reset() {
    disableTouch(false);
    setDefaultWidth(defaultContainerWidth);
  }

  function forceComplete() {
    setDefaultWidth(maxWidth);
    invokeOnSwipeSuccess(true);
  }

  function renderThumbIcon() {
    var iconWidth = 0;
    if (thumbIconWidth == undefined) {
      iconWidth = thumbIconHeight;
    } else {
      iconWidth = thumbIconWidth;
    }
    const dynamicStyles = {
      ...thumbIconStyles,
      height: thumbIconHeight,
      width: iconWidth,
      backgroundColor: disabled
        ? disabledThumbIconBackgroundColor
        : thumbIconBackgroundColor,
      borderColor: disabled
        ? disabledThumbIconBorderColor
        : thumbIconBorderColor,
      overflow: "hidden",
    };

    return (
      <View
        style={[styles.icon, { ...dynamicStyles }]}
        testID="DefaultThumbIcon"
      >
        {!ThumbIconComponent && thumbIconImageSource && (
          <Image resizeMethod="resize" source={thumbIconImageSource} />
        )}
        {ThumbIconComponent && (
          <View>
            <ThumbIconComponent />
          </View>
        )}
      </View>
    );
  }

  const panStyle = {
    backgroundColor,
    borderColor,
    width: animatedWidth,
    ...(enableReverseSwipe ? styles.containerRTL : styles.container),
    ...railStyles,
  };

  return (
    <Animated.View
      style={[panStyle]}
      {...panResponder.panHandlers}
      pointerEvents={shouldDisableTouch ? "none" : "auto"}
      testID="SwipeThumb"
    >
      {renderThumbIcon()}
    </Animated.View>
  );
};

SwipeThumb.propTypes = {
  disabled: PropTypes.bool,
  disableResetOnTap: PropTypes.bool,
  disabledThumbIconBackgroundColor: PropTypes.string,
  disabledThumbIconBorderColor: PropTypes.string,
  enableReverseSwipe: PropTypes.bool,
  finishRemainingSwipeAnimationDuration: PropTypes.number,
  forceCompleteSwipe: PropTypes.func,
  forceReset: PropTypes.func,
  layoutWidth: PropTypes.number,
  onSwipeFail: PropTypes.func,
  onSwipeStart: PropTypes.func,
  onSwipeSuccess: PropTypes.func,
  railFillBackgroundColor: PropTypes.string,
  railFillBorderColor: PropTypes.string,
  railStyles: PropTypes.object,
  resetAfterSuccessAnimDelay: PropTypes.number,
  shouldResetAfterSuccess: PropTypes.bool,
  swipeSuccessThreshold: PropTypes.number,
  thumbIconBackgroundColor: PropTypes.string,
  thumbIconBorderColor: PropTypes.string,
  thumbIconComponent: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.node,
    PropTypes.func,
  ]),
  thumbIconHeight: PropTypes.number,
  thumbIconImageSource: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
  thumbIconStyles: PropTypes.object,
  thumbIconWidth: PropTypes.number,
};

export default SwipeThumb;
