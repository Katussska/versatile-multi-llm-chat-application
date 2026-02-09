import ModelMessage from '@/components/chat/ModelMessage.tsx';
import UserMessage from '@/components/chat/UserMessage.tsx';

export default function ChatContent() {
  return (
    <div className="flex flex-1 flex-col items-center">
      <div className="mt-1 max-w-5xl flex-grow overflow-auto">
        <ModelMessage
          message={
            'Hello!ajgbvpiaerbpiqrwbfopqirfboquiwyfvbuyv oufwhpuf bw iufgwiprbf iwirfbipwuerbip wpeib pweurf' +
            'wiekfbie bwi biw iwrufbiwbf piwbf ibwi biwbf iwebf ibiw bfiebfiwebfiu bw ubiebfiweb iw iwubf iwubefibwedfi bwi biwub iubwefiweubfiwb ' +
            'wlofn bwiebf iweb ikb ioweb ike bofnlownfobndeol wnmwoi noebf ownef owl'
          }
        />
        <UserMessage message={'Hello!'} />
        <ModelMessage
          message={
            'Hello!ajgbvpiaerbpiqrwbfopqirfboquiwyfvbuyv oufwhpuf bw iufgwiprbf iwirfbipwuerbip wpeib pweurf' +
            'wiekfbie bwi biw iwrufbiwbf piwbf ibwi biwbf iwebf ibiw bfiebfiwebfiu bw ubiebfiweb iw iwubf iwubefibwedfi bwi biwub iubwefiweubfiwb ' +
            'wlofn bwiebf iweb ikb ioweb ike bofnlownfobndeol wnmwoi noebf ownef owl'
          }
        />
        <UserMessage
          message={
            'Hello! agbibfo[aweb ofhre ifgbro[hfor' +
            ' fo[rfogbbforrhohf orhfgurbdsan hoh ask; f;fh' +
            ' a;fgho; hao; hgak g;ahg a; hga; hgao; hgo;r' +
            'aghrgbfh gfhihfbi rhfowjpwjrf ojepwje dijcod oehorghds mjpijfrweih fob o'
          }
        />
        <ModelMessage
          message={
            'Hello!ajgbvpiaerbpiqrwbfopqirfboquiwyfvbuyv oufwhpuf bw iufgwiprbf iwirfbipwuerbip wpeib pweurf' +
            'wiekfbie bwi biw iwrufbiwbf piwbf ibwi biwbf iwebf ibiw bfiebfiwebfiu bw ubiebfiweb iw iwubf iwubefibwedfi bwi biwub iubwefiweubfiwb ' +
            'wlofn bwiebf iweb ikb ioweb ike bofnlownfobndeol wnmwoi noebf ownef owl'
          }
        />
        <UserMessage message={'Hello!'} />
        <ModelMessage
          message={
            'Hello!ajgbvpiaerbpiqrwbfopqirfboquiwyfvbuyv oufwhpuf bw iufgwiprbf iwirfbipwuerbip wpeib pweurf' +
            'wiekfbie bwi biw iwrufbiwbf piwbf ibwi biwbf iwebf ibiw bfiebfiwebfiu bw ubiebfiweb iw iwubf iwubefibwedfi bwi biwub iubwefiweubfiwb ' +
            'wlofn bwiebf iweb ikb ioweb ike bofnlownfobndeol wnmwoi noebf ownef owl'
          }
        />
        <UserMessage message={'Hello!'} />
        <ModelMessage
          message={
            'Hello!ajgbvpiaerbpiqrwbfopqirfboquiwyfvbuyv oufwhpuf bw iufgwiprbf iwirfbipwuerbip wpeib pweurf' +
            'wiekfbie bwi biw iwrufbiwbf piwbf ibwi biwbf iwebf ibiw bfiebfiwebfiu bw ubiebfiweb iw iwubf iwubefibwedfi bwi biwub iubwefiweubfiwb ' +
            'wlofn bwiebf iweb ikb ioweb ike bofnlownfobndeol wnmwoi noebf ownef owl'
          }
        />
      </div>
    </div>
  );
}
