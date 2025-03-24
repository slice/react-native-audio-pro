#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(AudioPro, NSObject)

RCT_EXTERN_METHOD(play:(NSString *)urlString)
RCT_EXTERN_METHOD(pause)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

@end
