#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(AudioPro, RCTEventEmitter)

RCT_EXTERN_METHOD(play:(NSDictionary *)track)
RCT_EXTERN_METHOD(pause)
RCT_EXTERN_METHOD(resume)
RCT_EXTERN_METHOD(stop)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

@end
