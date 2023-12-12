import { Injectable } from "@angular/core";
import { version } from "uuid";
import { UtilService } from "../..";
import { TelemetryConstants } from "../telemetryConstants";
import { Actor, Context, CorrelationData, DJPTelemetry, ProducerData } from "./telemetry";
import Telemetry = DJPTelemetry.Telemetry;

@Injectable({
    providedIn: 'root'
})
export class TelemetryDecorator {
    constructor(
        private utilService: UtilService
    ) { }

    decorate(
        event: Telemetry,
        sid: string,
        did: string,
        version: string,
        channelId: string,
        globalCData?: CorrelationData[]
    ): any {

        this.patchActor(event, '');
        this.patchContext(event, sid, did, version, channelId, globalCData);
        if (event.context.cdata) {
            event.context.cdata = [
                ...event.context.cdata, {
                    id: sid,
                    type: 'UserSession'
                }
            ];
        }

        return event;
    }

    private patchActor(event: Telemetry, uid: string) {
        if (!event.actor) {
            event.actor = new Actor();
        }
        const actor: Actor = event.actor;
        if (!actor.id) {
            actor.id = uid;
        }
        if (!actor.type) {
            actor.type = Actor.TYPE_USER;
        }
    }

    private patchContext(event: Telemetry, sid: string, did: string, version: string, channelId: string, globalCdata?: CorrelationData[]) {
        if (!event.context) {
            event.context = new Context();
        }
        event.context = this.buildContext(sid, did, channelId, event.context, version, globalCdata);
    }

    private patchPData(event: Context, version: string) {
        if (!event.pdata) {
            event.pdata = new ProducerData();
        }
        const pData: ProducerData = event.pdata;
        if (!pData.id) {
            pData.id = TelemetryConstants.PRODUCER_ID;
        }
        pData.pid = TelemetryConstants.PRODUCER_PID;

        if (!pData.ver) {
            pData.ver = version;
        }
    }

    prepare(event: Telemetry, priority: number) {
        return {
            event: JSON.stringify(event),
            event_type: event.eid,
            timestamp: Date.now(),
            priority: 1
        };
    }

    buildContext(sid: string, did: string, channelId: string, context: Context, version: string, globalCData?: CorrelationData[]): Context {
        context.channel = channelId;
        this.patchPData(context, version);
        if (!context.env) {
            context.env = 'app';
        }
        context.sid = sid;
        context.did = did;
        context.rollup = { l1: channelId };
        context.cdata = context.cdata ? context.cdata.concat(globalCData || []) : (globalCData || []);
        return context;
    }
}