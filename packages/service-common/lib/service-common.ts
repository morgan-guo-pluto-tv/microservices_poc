import { JSONValue, MessagingService } from 'enterprise_service_bus';

async function init(serverUrl: string, name: string): Promise<void> {
    await MessagingService.init(serverUrl, name);
    return MessagingService.publish('METRICS_START', { name, ts: Date.now() });
}

async function request(subject: string, req: JSONValue): Promise<JSONValue> {
    const res = await MessagingService.request(subject, req);
    await MessagingService.publish('METRICS_INVOKE', {
        from: MessagingService.clientServiceName,
        subject
    });
    return res;
}

type AsyncJSONValueMorph = (req: JSONValue) => Promise<JSONValue>;

async function setResponseFor(
    subscriptoService: string,
    subject: string,
    callback: AsyncJSONValueMorph
): Promise<void> {
    return MessagingService.subscribe(
        subscriptoService,
        subject,
        (msg, reply) => {
            if (!reply)
                throw new Error(
                    `${subscriptoService} reply not supplied by ${subject}`
                );
            callback(msg)
                .then((res) => MessagingService.response(reply, res))
                .catch((e) =>
                    console.error(
                        `Error during ${subscriptoService} ${subject} response`,
                        e
                    )
                );
        }
    );
}

async function set(subject: string, impl: AsyncJSONValueMorph): Promise<void> {
    await setResponseFor(MessagingService.serverUrl, subject, impl);
    console.log(`${subject} on ${MessagingService.serverUrl} Listener ready!`);
    console.log(
        `The ${subject} on ${MessagingService.serverUrl} was initialized successfully!`
    );
}

async function close(): Promise<void> {
    return MessagingService.close();
}

type AsyncJSONAction = (payload: JSONValue) => Promise<void>;

async function receive(subject: string, impl: AsyncJSONAction): Promise<void> {
    return MessagingService.subscribe(
        MessagingService.serverUrl,
        subject,
        (msg) =>
            impl(msg).catch((e) =>
                console.error(
                    `Error during ${MessagingService.serverUrl} ${subject} receive`,
                    e
                )
            )
    );
}

async function send(subject: string, msg: JSONValue): Promise<void> {
    return MessagingService.publish(subject, msg);
}

export { JSONValue, init, request, set, close, receive, send };
