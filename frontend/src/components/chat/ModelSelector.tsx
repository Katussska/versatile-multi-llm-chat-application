import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';

export default function ModelSelector() {
  return (
    <div className="flex justify-center p-5">
      <Select>
        <SelectTrigger className="w-auto border-background">
          <SelectValue placeholder="ChatGPT" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="chatgpt">ChatGPT</SelectItem>
          <SelectItem value="claude">Claude</SelectItem>
          <SelectItem value="ollama">Ollama</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
